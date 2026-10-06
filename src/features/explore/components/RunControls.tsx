import Button from '#components/Button.tsx';
import Icon from '#components/Icon.tsx';

interface RunControlsProps {
  // The step shown is the run's last, so there is nothing left to step to.
  finished: boolean;
  onStop: () => void;
  onNextStep: () => void;
  onFinish: () => void;
}

function RunControls(props: RunControlsProps) {
  const { finished, onStop, onNextStep, onFinish } = props;

  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      <Button variant="outline" onClick={onStop}>
        <Icon name="square" />
        Stop
      </Button>

      <div className="col-span-2 grid">
        {finished ? (
          <Button onClick={onFinish}>
            Finish
            <Icon name="check" />
          </Button>
        ) : (
          <Button onClick={onNextStep}>
            Next step
            <Icon name="step-forward" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default RunControls;
