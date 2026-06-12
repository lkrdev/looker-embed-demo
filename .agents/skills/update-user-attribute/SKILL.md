---
name: update-user-attribute
description: Guide on adding, modifying, or removing Looker user attributes (such as brand, locale) in both the frontend (state, constants, dialogs) and backend (Pydantic models, auth session endpoints) of this application.
---

# Updating or Adding Looker User Attributes

This skill details how to add new user attributes or rename/modify existing user attributes in the Looker Embed Demo application.

When adding or modifying user attributes (such as `brand`, `locale`, `company`, etc.), changes must be synchronized across both the backend (FastAPI) and frontend (React).

---

## 1. Backend Changes (FastAPI)

### Step 1.1: Update Pydantic Request Models
Define or update the attribute in [backend/app/models.py](file:///usr/local/google/home/maluka/looker-embed-demo/backend/app/models.py).
* Update `LookerLoginRequest` to include the attribute parameter and its default value:
  ```python
  class LookerLoginRequest(BaseModel):
      role_id: str = "viewer"
      locale: str = "en_US"
      brand: str = "Levi's" # <-- Add/modify attribute parameter here
  ```
* Update the default value for `CookielessAcquireRequest`'s `user_attributes` if applicable:
  ```python
  user_attributes: Dict[str, Any] = Field(
      default={"locale": "en_US", "brand": "Levi's"}
  )
  ```

### Step 1.2: Update Session / Login Endpoint
Map the request parameters to the user attributes passed to the Looker Embed/Cookieless session in [backend/app/api/endpoints/auth.py](file:///usr/local/google/home/maluka/looker-embed-demo/backend/app/api/endpoints/auth.py).
* Locate where `LookerUser` is constructed in the `/login` endpoint and assign the attribute inside `user_attributes`:
  ```python
  looker_user = LookerUser(
      looker_user_id=looker_user_id,
      role_id=body_req.role_id,
      permissions=permissions,
      models=["thelook"],
      user_attributes={
          "locale": body_req.locale,
          "brand": body_req.brand, # <-- Map attribute name to request value
      },
  )
  ```

---

## 2. Frontend Changes (React + TypeScript)

### Step 2.1: Update Constants & Options
Define default values, available options, and helper structures in [frontend/src/config/constants.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/config/constants.ts).
* Update default constants and options array:
  ```typescript
  export const DEFAULT_BRAND = "Levi's"
  export const BRAND_OPTIONS = ["Levi's", "Calvin Klein", "Allegra K", "Patagonia"]
  ```

### Step 2.2: Update TypeScript Types
Expose the new property and setter function in context and UI dialog states in [frontend/src/types/index.ts](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/types/index.ts).
* Update `PortalContextType`:
  ```typescript
  export interface PortalContextType {
    // ...
    brand: string
    setBrand: (brand: string) => void
    // ...
  }
  ```
* Update settings dialog view routing (`ViewType`):
  ```typescript
  export type ViewType = 'main' | 'userType' | 'language' | 'brand'
  ```

### Step 2.3: Update Portal Context & State Management
Initialize, handle, and synchronize the attribute in [frontend/src/context/PortalContext.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/context/PortalContext.tsx).
* Add a `useState` hook for the attribute:
  ```typescript
  const [brand, setBrandState] = useState<string>("Levi's")
  ```
* Update the `syncLookerSession` method to pass the attribute to the login request body payload:
  ```typescript
  const syncLookerSession = async (role: EmbedType, lang: string, brand: string) => {
    const response = await fetch(`${API_BASE_URL}/api/looker/login`, {
      method: 'POST',
      body: JSON.stringify({
        role_id: ROLE_ID_MAPPINGS[role] || 'viewer',
        locale: LANGUAGE_LOCALE_MAPPINGS[lang] || 'en',
        brand: brand // <-- Pass the attribute here
      })
    })
  }
  ```
* Add local storage persistence inside `useEffect` initialization and define a setter handler:
  ```typescript
  const handleSetBrand = (brnd: string) => {
    setBrandState(brnd)
    localStorage.setItem('brand', brnd)
    syncLookerSession(selectedType, language, brnd)
  }
  ```
* Provide the values through `PortalContext.Provider`:
  ```typescript
  <PortalContext.Provider
    value={{
      // ...
      brand,
      setBrand: handleSetBrand,
      // ...
    }}
  >
  ```

### Step 2.4: Update Dialogs and UI Components
* **User Details Modal** ([UserDetailsDialog.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/dialogs/UserDetailsDialog.tsx)):
  Destructure the state parameter and update `userSettingsJson` so the attribute is correctly displayed in the user profile debug window.
* **Settings Modal** ([SettingsDialog.tsx](file:///usr/local/google/home/maluka/looker-embed-demo/frontend/src/components/dialogs/SettingsDialog.tsx)):
  * Import custom options.
  * Destructure state and setter from context.
  * Add UI selection row and sub-dialog selectors mapping over options.

---

## 3. Verification

Always compile and verify changes:
1. **Frontend:** Run `pnpm build` in `frontend/` to verify TypeScript builds successfully.
2. **Backend:** Run `uv run python -m py_compile app/models.py app/api/endpoints/auth.py` in `backend/` to ensure syntax is valid.
