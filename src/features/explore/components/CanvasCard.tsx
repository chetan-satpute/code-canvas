import Card from '#components/Card.tsx';

function CanvasCard() {
  return (
    <Card padded={false}>
      {/* currentColor in the gradient resolves against text-border. */}
      <div className="text-border flex h-full items-center justify-center bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] bg-size-[24px_24px] bg-center">
        <span className="text-muted-foreground font-en text-sm">Canvas</span>
      </div>
    </Card>
  );
}

export default CanvasCard;
