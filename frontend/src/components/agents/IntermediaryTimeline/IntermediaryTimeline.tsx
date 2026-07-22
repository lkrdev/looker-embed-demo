import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Clock, Database, Code, Table } from 'lucide-react';
import { useLingui } from '@lingui/react';
import { IntermediaryTimeline as IntermediaryTimelineText } from '../../../config/IntermediaryTimeline';
import styles from './IntermediaryTimeline.module.css';

interface IntermediaryTimelineProps {
  steps: any[];
  isActiveStream?: boolean;
}

export const getTimelineStatusLabel = (steps: any[]): string => {
  const latestStep = steps && steps.length > 0 ? steps[steps.length - 1] : null;
  if (!latestStep) return 'Analyzing request and inspecting LookML metadata...';
  const msg = latestStep.message?.systemMessage || latestStep.systemMessage || latestStep;
  const parts = Array.isArray(msg?.text?.parts) ? msg.text.parts : null;
  const schema = msg?.schema;
  const query = msg?.data?.generatedLookerQuery || msg?.data?.query || msg?.query;
  const result = msg?.data?.result || msg?.result;
  const chartConfig = msg?.chart || msg?.vegaConfig;
  if (chartConfig) {
    return 'Rendering visualization spec...';
  } else if (result) {
    return 'Formatting query results and visualization...';
  } else if (query) {
    return 'Executing generated Looker query...';
  } else if (schema) {
    return `Inspecting schema model (${schema.model || 'embed_demo'}) and explore (${schema.explore || 'order_items'})...`;
  } else if (parts && parts.length > 0) {
    return `${parts[0]}...`;
  }
  return 'Processing step...';
};

export const IntermediaryTimeline: React.FC<IntermediaryTimelineProps> = ({ steps, isActiveStream }) => {
  const { i18n } = useLingui();
  const [isExpanded, setIsExpanded] = useState<boolean>(Boolean(isActiveStream));

  useEffect(() => {
    setIsExpanded(Boolean(isActiveStream));
  }, [isActiveStream]);

  if (!steps || steps.length === 0) return null;

  const activeStatusLabel = getTimelineStatusLabel(steps);

  return (
    <div className={styles.agentsTimelineContainer}>
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.agentsTimelineHeader}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{i18n._(IntermediaryTimelineText.AGENT_PROGRESS)} ({steps.length} {steps.length === 1 ? i18n._(IntermediaryTimelineText.STEP) : i18n._(IntermediaryTimelineText.STEPS)})</span>
          {isActiveStream && (
            <span className={styles.agentsLiveBadge}>
              <span className={styles.agentsLiveDot} />
              {i18n._(IntermediaryTimelineText.WORKING)}
            </span>
          )}
        </div>
        <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </button>

      {/* Expanded Timeline Content with Smooth Collapse Animation */}
      <div className={`${styles.agentsTimelineCollapseWrapper} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.agentsTimelineCollapseInner}>
          <div className={styles.agentsTimelineBody}>
            {/* Vertical connecting line */}
            <div className={styles.agentsTimelineLine} />

            {steps.map((step, index) => {
              const msg = step.message?.systemMessage || step.systemMessage || step;
              const parts = Array.isArray(msg?.text?.parts) ? msg.text.parts : null;
              const rawString = typeof msg?.text === 'string' ? msg.text : (typeof msg?.text?.parts === 'string' ? msg.text.parts : null);
              const query = msg.data?.generatedLookerQuery || msg.data?.query || msg.query;
              const result = msg.data?.result || msg.result;
              const schema = msg.schema;
              const chartConfig = msg.chart || msg.vegaConfig;
              const isFallbackStep = !parts && !rawString && !query && !result && !schema;

              const schemaModel = schema?.model || schema?.model_name || schema?.name;
              const schemaExplore = schema?.explore || schema?.view || schema?.view_name;
              const schemaViews = schema?.views ? (Array.isArray(schema.views) ? schema.views.join(', ') : String(schema.views)) : null;

              return (
                <div key={index} className={styles.agentsTimelineStep}>
                  {/* Timeline Node Icon */}
                  <div className={styles.agentsTimelineIcon}>
                    {query ? <Code size={12} style={{ color: 'var(--primary)' }} /> :
                     result ? <Table size={12} style={{ color: 'var(--success)' }} /> :
                     schema ? <Database size={12} style={{ color: 'var(--accent)' }} /> :
                     <Clock size={12} />}
                  </div>

                  {/* Step Content */}
                  <div className={styles.agentsTimelineContent}>
                    {isFallbackStep && (
                      <div className={styles.agentsTimelineText}>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {chartConfig ? i18n._(IntermediaryTimelineText.GENERATED_QUERY) || 'Generated Visualization Specification' : 'Processing step...'}
                        </div>
                      </div>
                    )}

                    {/* 1. Thinking / Progress Text */}
                    {(parts || rawString) && (
                      <div className={styles.agentsTimelineText}>
                        {parts && parts.length > 0 ? (
                          <>
                            {parts.length === 1 ? (
                              <div>{parts[0]}</div>
                            ) : (
                              <>
                                <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '6px', fontSize: '14px' }}>
                                  {parts[0]}
                                </div>
                                <div style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                                  {parts.slice(1).join('\n\n')}
                                </div>
                              </>
                            )}
                          </>
                        ) : (
                          <div>{rawString}</div>
                        )}
                      </div>
                    )}

                    {/* 2. LookML Schema Message */}
                    {schema && (
                      <div className={styles.agentsSchemaCard}>
                        <Database size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{i18n._(IntermediaryTimelineText.SCHEMA_REFERENCE)}</div>
                          <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {i18n._(IntermediaryTimelineText.CONSULTED_MODEL)} <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{schemaModel || 'embed_demo'}</span> • {i18n._(IntermediaryTimelineText.EXPLORE)} <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{schemaExplore || 'order_items'}</span>
                            {schemaViews && <span> • {i18n._(IntermediaryTimelineText.VIEWS)} [{schemaViews}]</span>}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Formatted Query JSON */}
                    {query && (
                      <div className={styles.agentsQueryCard}>
                        <div className={styles.agentsQueryHeader}>
                          <Code size={13} />
                          <span>{i18n._(IntermediaryTimelineText.GENERATED_QUERY)}</span>
                        </div>
                        <pre className={styles.agentsQueryPre}>
                          {JSON.stringify(query, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* 4. Raw Data Result Preview Table (Max 100 rows) */}
                    {result && result.data && Array.isArray(result.data) && (
                      <div className={styles.agentsTableCard}>
                        <div className={styles.agentsTableHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Table size={13} style={{ color: 'var(--success)' }} />
                            <span>{i18n._(IntermediaryTimelineText.DATA_PREVIEW)}</span>
                          </div>
                          <span className={styles.agentsTableBadge}>
                            {result.data.length > 100 ? `${i18n._(IntermediaryTimelineText.SHOWING_FIRST_100_OF)} ${result.data.length} ${i18n._(IntermediaryTimelineText.ROWS)}` : `${result.data.length} ${i18n._(IntermediaryTimelineText.ROWS)}`}
                          </span>
                        </div>
                        <div className={styles.agentsTableWrap}>
                          <table className={styles.agentsTable}>
                            <thead>
                              <tr>
                                {(result.data[0] && typeof result.data[0] === 'object' ? Object.keys(result.data[0]) : []).map((col, idx) => (
                                  <th key={idx}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.data.slice(0, 100).map((row: any, rIdx: number) => (
                                <tr key={rIdx}>
                                  {(row && typeof row === 'object' ? Object.values(row) : [String(row ?? '')]).map((val: any, cIdx: number) => (
                                    <td key={cIdx}>{String(val ?? '')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Active Streaming Step at bottom of timeline */}
            {isActiveStream && (
              <div className={styles.agentsTimelineActiveStep}>
                <div className={styles.agentsTimelineActiveIcon}>
                  <div className={styles.agentsPulseDot} />
                </div>
                <div className={styles.agentsTimelineActiveContent}>
                  <span className={styles.agentsActiveStatusText}>{activeStatusLabel}</span>
                  <div className={styles.agentsActiveDots}>
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
