import { useStoreActions } from './store/hooks';
import './App.css';

import Dice from './components/dice';
import RollButton from './components/RollButton';
import Score from './components/score';
import { useStoreState } from './store/hooks';

function App() {
  const started = useStoreState(state => state.game.started);
  const start = useStoreActions(actions => actions.start);
  const player = useStoreState(state => state.game.player);

  return (

    <div className="App">
      <header className="App-header">
          <h1>Yahtzee</h1>
          {!started && <button className='bg-yellow-500 p-2 rounded w-full' onClick={start}>Start</button>}
          {!!started && (<>
            <h3>Player: {player?.name}</h3>
            <Dice />
            <RollButton />
            <Score />
          </>)}
      </header>
    </div>
  );
}

export default App;
