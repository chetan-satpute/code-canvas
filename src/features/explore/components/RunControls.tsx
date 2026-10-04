import Button from '#components/Button.tsx';
import Icon from '#components/Icon.tsx';

interface RunControlsProps {
  onStop: () => void;
  onNextStep: () => void;
}

function RunControls(props: RunControlsProps) {
  const { onStop, onNextStep } = props;

  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      <Button variant="outline" onClick={onStop}>
        <Icon name="square" />
        Stop
      </Button>

      <div className="col-span-2 grid">
        <Button onClick={onNextStep}>
          Next step
          <Icon name="step-forward" />
        </Button>
      </div>
    </div>
  );
}

export default RunControls;
