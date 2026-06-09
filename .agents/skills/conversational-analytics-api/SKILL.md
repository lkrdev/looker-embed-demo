---
name: conversational-analytics-api
description: Use this skill when you need to build AI-powered chat interfaces (data agents) that query Looker data using natural language via the Gemini Data Analytics API.
---

# Gemini Data Analytics API (Conversational Analytics) with Looker

This skill enables agents to assist users in building AI-powered chat interfaces (data agents) that query Looker data using natural language via the Gemini Data Analytics API (formerly Conversational Analytics API).

## Overview
The Gemini Data Analytics API (`geminidataanalytics.googleapis.com`) allows developers to build "data agents" that can answer natural language questions about structured data in Looker Explores. It leverages Gemini to translate user questions into Looker queries.

## 1. Prerequisites & Setup
### Enable APIs
- [cloudaicompanion API](https://console.cloud.google.com/apis/library/cloudaicompanion.googleapis.com)
- [Gemini Data Analytics API](https://console.cloud.google.com/apis/library/geminidataanalytics.googleapis.com)
- [Vertex AI API](https://console.cloud.google.com/apis/library/aiplatform.googleapis.com)

### Required IAM Roles
- **Gemini Data Analytics Data Agent Creator** (`roles/geminidataanalytics.dataAgentCreator`): To create and manage agents.
- **Gemini for Google Cloud User** (`roles/cloudaicompanion.user`): To interact with agents.
- **Looker Instance User** (`roles/looker.instanceUser`): For Google Cloud Core instances.
- **Looker Role**: The user must have a Looker role with the `gemini_in_looker` permission for the relevant models.

## 2. Connecting to Looker Data Source
A data agent needs a connection to one or more Looker Explores.

### Authentication Methods
1.  **OAuth Client Credentials**: Recommended for service-to-service communication.
2.  **Access Token**: Useful for short-lived sessions or specific user contexts.

### Client Initialization
```python
from google.cloud import geminidataanalytics_v1beta as geminidataanalytics

data_agent_client = geminidataanalytics.DataAgentServiceClient()
data_chat_client = geminidataanalytics.DataChatServiceClient()
```

### Data Source Configuration (Python SDK Example)
```python
# Define Looker Explore Reference
looker_explore = geminidataanalytics.LookerExploreReference()
looker_explore.looker_instance_uri = "https://your_company.looker.com"
looker_explore.lookml_model = "sales_model"
looker_explore.explore = "orders"

# Configure Credentials
credentials = geminidataanalytics.Credentials()
credentials.oauth.secret.client_id = "YOUR_CLIENT_ID"
credentials.oauth.secret.client_secret = "YOUR_CLIENT_SECRET"

# Set Datasource References
datasource_references = geminidataanalytics.DatasourceReferences()
datasource_references.looker.explore_references = [looker_explore]
```

## 3. Creating a Data Agent
A data agent combines the data source with instructions and context.

### Key Components
- **System Instructions**: Define business logic, response formatting, and persona (see section 5).
- **Golden Queries (Authored Context)**: Provide examples of natural language questions paired with their correct Looker queries to improve accuracy.

### Looker Golden Query Example
```python
looker_golden_queries = [
    geminidataanalytics.LookerGoldenQuery(
        natural_language_questions=[
            "What are the major airport codes and cities in CA?",
            "Can you list the cities and airport codes of airports in CA?",
        ],
        looker_query=geminidataanalytics.LookerQuery(
            model="airports",
            explore="airports",
            fields=["airports.city", "airports.code"],
            filters=[
                geminidataanalytics.LookerQuery.Filter(field="airports.major", value="Y"),
                geminidataanalytics.LookerQuery.Filter(field="airports.state", value="CA"),
            ],
        ),
    )
]
```

### Published Context & Creation
```python
published_context = geminidataanalytics.Context(
    system_instruction="Think like an Analyst",
    datasource_references=datasource_references,
    looker_golden_queries=looker_golden_queries, # Optional
)

data_agent = geminidataanalytics.DataAgent(
    data_analytics_agent=geminidataanalytics.DataAnalyticsAgent(
        published_context=published_context
    ),
)

request = geminidataanalytics.CreateDataAgentRequest(
    parent="projects/PROJECT_ID/locations/LOCATION",
    data_agent_id="my-looker-agent",
    data_agent=data_agent,
)
operation = data_agent_client.create_data_agent(request=request)
```

## 4. Interaction (Chat)
Users interact with the agent via the `Chat` method.

### [Stateful] Chat with Conversation Reference
Maintains history and uses a pre-created conversation.
```python
conversation_reference = geminidataanalytics.ConversationReference(
    conversation=data_chat_client.conversation_path(PROJECT_ID, LOCATION, CONVERSATION_ID),
    data_agent_context=geminidataanalytics.DataAgentContext(
        data_agent=data_chat_client.data_agent_path(PROJECT_ID, LOCATION, AGENT_ID),
        credentials=credentials, # Required for Looker
    ),
)

request = geminidataanalytics.ChatRequest(
    parent=f"projects/{PROJECT_ID}/locations/{LOCATION}",
    messages=[geminidataanalytics.Message(user_message=geminidataanalytics.UserMessage(text="Sales in CA?"))],
    conversation_reference=conversation_reference,
)
stream = data_chat_client.chat(request=request)
```

### [Stateless] Chat with Inline Context
Useful for testing or one-off queries without a persistent agent.
```python
request = geminidataanalytics.ChatRequest(
    inline_context=published_context,
    parent=f"projects/{PROJECT_ID}/locations/{LOCATION}",
    messages=[geminidataanalytics.Message(user_message=geminidataanalytics.UserMessage(text="Total orders?"))],
)
# Note: For Looker with Inline Context, pass credentials inside datasource_references
request.inline_context.datasource_references.looker.credentials = credentials
```

## 5. System Instructions (Analyst Persona)
Using a YAML template for `system_instruction` is highly recommended to guide the agent.

```yaml
- system_instruction: >-
    You are an expert sales analyst for an e-commerce store.
- tables:
    - table:
        - name: sales_model.orders
        - description: orders data.
        - fields:
            - field:
                - name: status
                - description: order status (complete, shipped, etc.)
        - measures:
            - measure:
                - name: profit
                - description: raw profit
                - exp: cost - earnings
```

## 6. Best Practices & Optimization
- **Robust LookML**: Ensure Explores have clear `description`, `label`, and `view_label` tags.
- **Use Golden Queries**: Provide 5-10 examples of complex questions.
- **Analysis Options**: Enable `python` in `AnalysisOptions` for advanced data processing (e.g., forecasting).
- **IAM Management**: Use `data_agent_client.set_iam_policy` to share agents with specific users or groups.

## 7. Troubleshooting
- **Permission Denied**: Check Google Cloud IAM roles and Looker `gemini_in_looker` permissions.
- **Low Accuracy**: Refine `system_instruction` or add more `looker_golden_queries`.
- **Connection Errors**: Verify `looker_instance_uri` and ensure network connectivity (e.g., PSC/VPC-SC).

## 8. Processing the API Response

The Gemini Data Analytics API streams responses as structured messages. The response object contains a `systemMessage` field, which can hold different types of content as the conversation progresses.

### API Response Structure

The `systemMessage` typically contains one of the following:

#### 1. Text Messages (`systemMessage.text`)
Used for thoughts, progress updates, and the final response.
- `parts`: An array of strings containing the message content.
- `textType`: An enum indicating the type of text:
    - `THOUGHT`: The agent's reasoning process.
    - `PROGRESS`: Background steps being taken (e.g., "Fetching data").
    - `FINAL_RESPONSE`: The final answer to the user's question.

> [!TIP]
> To improve UI readability, it is recommended to group sequential `THOUGHT` and `PROGRESS` messages in the UI to avoid clutter.

#### 2. Data Messages (`systemMessage.data`)
Used to return query definitions and data results.

##### A. Query Reference
When the agent determines a query to run, it emits a `query` object:
```json
{
  "query": {
    "name": "top_selling_products",
    "looker": {
      "model": "basic_ecomm",
      "explore": "basic_order_items",
      "fields": ["basic_products.name", "basic_order_items.count"],
      "sorts": ["basic_order_items.count desc"],
      "limit": "10",
      "filters": [
        {
          "field": "basic_users.state",
          "value": "California"
        }
      ]
    }
  }
}
```
> [!IMPORTANT]
> Note that `filters` is an **Array of objects** (with `field` or `name` and `value` properties). When generating Looker Explore URLs from this data, ensure you iterate over the array and construct the URL parameters as `&f[field_name]=value`.

##### B. Data Results
When the query completes, the agent emits the result data:
```json
{
  "result": {
    "data": [
      {
        "basic_products.name": "Product A",
        "basic_order_items.count": 5.0
      }
    ],
    "name": "top_selling_products",
    "schema": {
      "fields": [
        {
          "name": "basic_products.name",
          "type": "string",
          "displayName": "Name"
        },
        {
          "name": "basic_order_items.count",
          "type": "count",
          "displayName": "# of Order Items",
          "value_format": "$#,##0.00"
        }
      ]
    }
  }
}
```

#### 3. Chart Messages (`systemMessage.chart`)
Contains visualization configurations.
- `vegaConfig`: A JSON object with the Vega-Lite specification for rendering the chart.
- `image`: May contain a generated PNG image of the chart.

### Data Processing Best Practices
- **Schema-aware Formatting**: The `schema.fields` array in the data result may contain `value_format` strings (e.g., for currency or percentages). Production applications should use these format strings to render table values correctly.
- **Heuristic Fallback**: If `value_format` is missing, fall back to checking the field name for keywords like `"price"`, `"revenue"`, or `"cost"` to apply currency formatting.
