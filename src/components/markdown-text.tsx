import Markdown from 'ink-markdown-es';

const MarkdownText = ({ children }: { children: string }) => {
  return <Markdown showSharp>{children}</Markdown>;
};

export default MarkdownText;
