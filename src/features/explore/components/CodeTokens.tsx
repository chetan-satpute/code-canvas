import type { CodeLine } from '#utils/code.ts';

interface CodeTokensProps {
  tokens: CodeLine;
}

// The spans of one highlighted line. Placing them inside a <code> is left to
// the caller, because a listing and a call stack frame wrap a line
// differently.
function CodeTokens(props: CodeTokensProps) {
  const { tokens } = props;

  return (
    <>
      {tokens.map((token, index) => (
        <span
          key={index}
          style={{
            color: token.color,
            fontStyle: token.italic ? 'italic' : undefined,
            fontWeight: token.bold ? 'bold' : undefined,
          }}
        >
          {token.content}
        </span>
      ))}
    </>
  );
}

export default CodeTokens;
