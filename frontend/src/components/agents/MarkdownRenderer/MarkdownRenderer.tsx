import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './MarkdownRenderer.module.css';

interface MarkdownRendererProps {
  content?: string | null;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  return (
    <div className={styles.agentsMarkdownContainer}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '1.5rem',
                margin: '20px 0 10px 0',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '6px',
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '1.3rem',
                margin: '18px 0 8px 0',
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '1.15rem',
                margin: '14px 0 6px 0',
              }}
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              style={{
                color: 'var(--text)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
                fontSize: '1.05rem',
                margin: '12px 0 4px 0',
              }}
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p
              style={{
                margin: '0 0 14px 0',
                lineHeight: 1.65,
                color: 'var(--text)',
              }}
              {...props}
            />
          ),
          strong: ({ node, ...props }) => (
            <strong style={{ fontWeight: 600, color: 'var(--text)' }} {...props} />
          ),
          em: ({ node, ...props }) => (
            <em style={{ fontStyle: 'italic' }} {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent)',
                textDecoration: 'underline',
                fontWeight: 500,
              }}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              style={{
                margin: '8px 0 14px 22px',
                paddingLeft: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                listStyleType: 'disc',
                color: 'var(--text)',
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                margin: '8px 0 14px 22px',
                paddingLeft: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                listStyleType: 'decimal',
                color: 'var(--text)',
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li style={{ lineHeight: 1.65 }} {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: '3px solid var(--accent)',
                margin: '12px 0',
                padding: '10px 16px',
                backgroundColor: 'var(--surface-hover)',
                borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
              {...props}
            />
          ),
          hr: ({ node, ...props }) => (
            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--border)',
                margin: '20px 0',
              }}
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.88em',
                    padding: '2px 6px',
                    backgroundColor: 'var(--surface-hover)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    color: 'var(--accent)',
                    margin: '0 2px',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className={styles.agentsQueryCard}>
                {match && (
                  <div className={styles.agentsQueryHeader}>
                    <span>{match[1]}</span>
                  </div>
                )}
                <pre className={styles.agentsQueryPre}>
                  <code style={{ fontFamily: 'monospace', fontSize: '0.9em' }} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          table: ({ node, ...props }) => (
            <div className={styles.agentsTableCard}>
              <div className={styles.agentsTableWrap}>
                <table className={styles.agentsTable} {...props} />
              </div>
            </div>
          ),
          thead: ({ node, ...props }) => <thead {...props} />,
          tbody: ({ node, ...props }) => <tbody {...props} />,
          tr: ({ node, ...props }) => <tr {...props} />,
          th: ({ node, ...props }) => <th {...props} />,
          td: ({ node, ...props }) => <td {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
