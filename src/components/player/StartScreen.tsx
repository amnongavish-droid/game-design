interface Props {
  onStart: () => void;
}

export function StartScreen({ onStart }: Props) {
  return (
    <div className="start-screen">
      <h2>Give / Take</h2>
      <p>
        Green and Blue each start with 1000 objects. On your turn, play a card to set your
        objects' give/take rule, then watch the round of encounters play out. Reach a stable
        equilibrium before the central pool runs dry.
      </p>
      <button className="start-screen__button" onClick={onStart}>
        Start Game
      </button>
    </div>
  );
}
