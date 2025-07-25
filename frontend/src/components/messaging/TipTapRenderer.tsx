import React from 'react';

interface TipTapRendererProps {
  content: any; // TipTap JSON content
}

export const TipTapRenderer: React.FC<TipTapRendererProps> = ({ content }) => {
  console.log('TipTapRenderer received content:', JSON.stringify(content, null, 2));
  
  const renderNode = (node: any, index: number = 0): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case 'doc':
        return (
          <div key={index}>
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </div>
        );

      case 'paragraph':
        return (
          <p key={index} className="mb-2 last:mb-0">
            {node.content?.map((child: any, i: number) => renderNode(child, i)) || <br />}
          </p>
        );

      case 'heading':
        const level = node.attrs?.level || 1;
        const headingClasses = {
          1: 'text-2xl font-bold mb-2',
          2: 'text-xl font-bold mb-2',
          3: 'text-lg font-bold mb-1',
          4: 'text-base font-bold mb-1',
          5: 'text-sm font-bold mb-1',
          6: 'text-xs font-bold mb-1',
        };
        
        const className = headingClasses[level as keyof typeof headingClasses] || headingClasses[1];
        const content = node.content?.map((child: any, i: number) => renderNode(child, i));
        
        switch (level) {
          case 1: return <h1 key={index} className={className}>{content}</h1>;
          case 2: return <h2 key={index} className={className}>{content}</h2>;
          case 3: return <h3 key={index} className={className}>{content}</h3>;
          case 4: return <h4 key={index} className={className}>{content}</h4>;
          case 5: return <h5 key={index} className={className}>{content}</h5>;
          case 6: return <h6 key={index} className={className}>{content}</h6>;
          default: return <h1 key={index} className={className}>{content}</h1>;
        }

      case 'text':
        let textElement: React.ReactNode = node.text;
        
        // Apply marks (formatting)
        if (node.marks) {
          console.log('Processing marks for text:', node.text, 'marks:', node.marks);
          for (const mark of node.marks) {
            console.log('Processing mark:', mark.type, mark);
            switch (mark.type) {
              case 'bold':
                textElement = <strong key={`bold-${index}`}>{textElement}</strong>;
                break;
              case 'italic':
                textElement = <em key={`italic-${index}`}>{textElement}</em>;
                break;
              case 'code':
                textElement = (
                  <code 
                    key={`code-${index}`}
                    className="bg-gray-100 dark:bg-gray-800 text-red-600 dark:text-red-400 px-1 py-0.5 rounded text-sm font-mono"
                  >
                    {textElement}
                  </code>
                );
                break;
              case 'underline':
                textElement = <u key={`underline-${index}`}>{textElement}</u>;
                break;
              case 'strike':
                textElement = <s key={`strike-${index}`}>{textElement}</s>;
                break;
              case 'textStyle':
                // Handle color and fontSize from TextStyle mark
                const styleAttrs: any = {};
                if (mark.attrs?.color) {
                  styleAttrs.color = mark.attrs.color;
                }
                if (mark.attrs?.fontSize) {
                  styleAttrs.fontSize = mark.attrs.fontSize;
                  // Add bold for large sizes
                  if (mark.attrs.fontSize === '1.5rem' || mark.attrs.fontSize === '1.25rem') {
                    styleAttrs.fontWeight = 'bold';
                  }
                }
                
                if (Object.keys(styleAttrs).length > 0) {
                  console.log('Applying textStyle with attrs:', mark.attrs, 'to text:', node.text);
                  textElement = (
                    <span 
                      key={`textstyle-${index}`}
                      style={styleAttrs}
                    >
                      {textElement}
                    </span>
                  );
                }
                break;
              case 'highlight':
                textElement = (
                  <span 
                    key={`highlight-${index}`}
                    className="px-1 py-0.5 rounded"
                    style={{ backgroundColor: mark.attrs?.color || '#FFFF00' }}
                  >
                    {textElement}
                  </span>
                );
                break;
            }
          }
        }
        
        return <span key={index}>{textElement}</span>;

      case 'codeBlock':
        return (
          <pre key={index} className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-x-auto mb-2">
            <code className="text-sm font-mono">
              {node.content?.map((child: any, i: number) => renderNode(child, i))}
            </code>
          </pre>
        );

      case 'blockquote':
        return (
          <blockquote key={index} className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic mb-2">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </blockquote>
        );

      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-inside mb-2 space-y-1">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ul>
        );

      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-inside mb-2 space-y-1">
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </ol>
        );

      case 'listItem':
        return (
          <li key={index}>
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </li>
        );

      case 'mention':
        return (
          <span 
            key={index}
            className="mention bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded font-medium cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
            title={`@${node.attrs?.label || node.attrs?.id}`}
          >
            @{node.attrs?.label || node.attrs?.id}
          </span>
        );

      case 'hardBreak':
        return <br key={index} />;

      default:
        // Fallback for unknown node types
        if (node.content) {
          return (
            <span key={index}>
              {node.content.map((child: any, i: number) => renderNode(child, i))}
            </span>
          );
        }
        return null;
    }
  };

  // Handle edge cases
  if (!content) {
    return <span>Empty message</span>;
  }

  if (typeof content === 'string') {
    return <span>{content}</span>;
  }

  try {
    return (
      <>
        <style>{`
          .tiptap-message p {
            margin: 0.25rem 0 !important;
            line-height: 1.5 !important;
            font-size: 1rem !important;
          }
          .tiptap-message strong {
            font-weight: bold !important;
          }
          .tiptap-message em {
            font-style: italic !important;
          }
          .tiptap-message u {
            text-decoration: underline !important;
          }
          .tiptap-message s {
            text-decoration: line-through !important;
          }
          .tiptap-message code {
            background-color: rgba(156, 163, 175, 0.2) !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
            font-family: 'Courier New', monospace !important;
            font-size: 0.9em !important;
          }
        `}</style>
        <div className="tiptap-message">
          {renderNode(content)}
        </div>
      </>
    );
  } catch (error) {
    console.error('Error rendering TipTap content:', error);
    return <span className="text-red-500">Error displaying message</span>;
  }
};