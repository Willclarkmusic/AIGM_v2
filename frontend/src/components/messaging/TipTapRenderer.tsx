import React from 'react';

interface TipTapRendererProps {
  content: any; // TipTap JSON content
}

export const TipTapRenderer: React.FC<TipTapRendererProps> = ({ content }) => {
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
        const HeadingTag = `h${node.attrs?.level || 1}` as keyof JSX.IntrinsicElements;
        const headingClasses = {
          1: 'text-xl font-bold mb-2',
          2: 'text-lg font-bold mb-2',
          3: 'text-base font-bold mb-1',
          4: 'text-sm font-bold mb-1',
          5: 'text-xs font-bold mb-1',
          6: 'text-xs font-bold mb-1',
        };
        
        return (
          <HeadingTag key={index} className={headingClasses[node.attrs?.level as keyof typeof headingClasses] || headingClasses[1]}>
            {node.content?.map((child: any, i: number) => renderNode(child, i))}
          </HeadingTag>
        );

      case 'text':
        let textElement: React.ReactNode = node.text;
        
        // Apply marks (formatting)
        if (node.marks) {
          for (const mark of node.marks) {
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
    return <>{renderNode(content)}</>;
  } catch (error) {
    console.error('Error rendering TipTap content:', error);
    return <span className="text-red-500">Error displaying message</span>;
  }
};