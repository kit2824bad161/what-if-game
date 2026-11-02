import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import os from 'os';
import { io } from '../../../client/node_modules/socket.io-client/build/esm/index.js';
import { isAllowedOrigin } from '../config/cors.js';

function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

describe('Two-Player LAN Networking & Socket.IO Suite', () => {

  const LAN_IP = getLanIp();
  const BACKEND_LAN_URL = `http://${LAN_IP}:5000`;
  const FRONTEND_LAN_ORIGIN = `http://${LAN_IP}:5173`;

  it('Verifies CORS policy allows LAN origins on port 5173 and rejects unauthorized origins', () => {
    // Permitted LAN origins
    assert.equal(isAllowedOrigin('http://localhost:5173'), true, 'Localhost 5173 allowed');
    assert.equal(isAllowedOrigin('http://127.0.0.1:5173'), true, 'Loopback 5173 allowed');
    assert.equal(isAllowedOrigin(FRONTEND_LAN_ORIGIN), true, 'LAN origin 10.x.x.x / 192.168.x.x allowed');
    assert.equal(isAllowedOrigin('http://192.168.1.100:5173'), true, 'LAN origin 192.168.x.x:5173 allowed');
    assert.equal(isAllowedOrigin('http://172.20.10.2:5173'), true, 'LAN origin 172.x.x.x:5173 allowed');

    // Rejected non-LAN / unauthorized origins
    assert.equal(isAllowedOrigin('http://attacker.com'), false, 'Malicious domain rejected');
    assert.equal(isAllowedOrigin(`http://${LAN_IP}:8080`), false, 'Non-game port rejected');
  });

  it('Verifies REST API accepts requests from LAN origin with correct CORS headers', async () => {
    const res = await fetch(`${BACKEND_LAN_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Origin': FRONTEND_LAN_ORIGIN,
      },
    });

    assert.equal(res.status, 200, 'LAN health endpoint returns 200');
    assert.equal(res.headers.get('access-control-allow-origin'), FRONTEND_LAN_ORIGIN, 'CORS header echoes LAN origin');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true', 'CORS credentials allowed');

    const data = await res.json();
    assert.equal(data.status, 'healthy');
  });

  it('Executes two-player multiplayer flow over LAN: Host creates room, Player 2 joins from LAN, state synchronizes', async () => {
    // 1. Host (Player 1) connects from localhost
    const socketHost = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      extraHeaders: { Origin: 'http://localhost:5173' },
      forceNew: true,
    });

    // 2. Client 2 (Player 2) connects from LAN IP (simulating second device on Wi-Fi)
    const socketLanClient = io(BACKEND_LAN_URL, {
      transports: ['websocket', 'polling'],
      extraHeaders: { Origin: FRONTEND_LAN_ORIGIN },
      forceNew: true,
    });

    try {
      // Wait for both sockets to connect
      await Promise.all([
        new Promise((resolve, reject) => {
          socketHost.on('connect', resolve);
          socketHost.on('connect_error', reject);
        }),
        new Promise((resolve, reject) => {
          socketLanClient.on('connect', resolve);
          socketLanClient.on('connect_error', reject);
        }),
      ]);

      assert.ok(socketHost.id, 'Host must receive socket ID');
      assert.ok(socketLanClient.id, 'LAN client must receive socket ID');
      assert.notEqual(socketHost.id, socketLanClient.id, 'Host and LAN client must have distinct socket IDs');

      // 3. Host creates a room
      const roomCreatedPromise = new Promise((resolve) => {
        socketHost.once('room:created', resolve);
      });

      socketHost.emit('room:create', {
        hostId: 'guest-host-p1',
        hostName: 'Commander Vikram (Host)',
        mode: 'storyBattle',
      });

      const room = await roomCreatedPromise;
      assert.ok(room.roomCode, 'Room code must be generated');
      assert.equal(room.players.length, 1, 'Room has 1 player initially');
      assert.equal(room.hostId, 'guest-host-p1');

      // 4. Player 2 joins the room from the LAN IP
      const p1UpdatedPromise = new Promise((resolve) => {
        socketHost.once('room:updated', resolve);
      });
      const p2UpdatedPromise = new Promise((resolve) => {
        socketLanClient.once('room:updated', resolve);
      });

      socketLanClient.emit('room:join', {
        roomCode: room.roomCode,
        playerId: 'guest-lan-p2',
        playerName: 'Agent Amar (Second Device)',
      });

      const [updatedForHost, updatedForLan] = await Promise.all([p1UpdatedPromise, p2UpdatedPromise]);

      assert.equal(updatedForHost.players.length, 2, 'Host receives room update with 2 players');
      assert.equal(updatedForLan.players.length, 2, 'LAN client receives room update with 2 players');
      assert.equal(updatedForLan.players[1].name, 'Agent Amar (Second Device)');

      // 5. Player 2 toggles ready state
      const readyUpdatePromise = new Promise((resolve) => {
        socketHost.once('room:updated', resolve);
      });

      socketLanClient.emit('room:toggle_ready', {
        roomCode: room.roomCode,
        playerId: 'guest-lan-p2',
      });

      const readyRoom = await readyUpdatePromise;
      const p2State = readyRoom.players.find(p => p.playerId === 'guest-lan-p2');
      assert.equal(p2State?.isReady, true, 'Player 2 ready state synchronized over LAN');

    } finally {
      socketHost.disconnect();
      socketLanClient.disconnect();
    }
  });

  it('Verifies WebSocket transport explicitly over LAN IP', async () => {
    const wsSocket = io(BACKEND_LAN_URL, {
      transports: ['websocket'],
      extraHeaders: { Origin: FRONTEND_LAN_ORIGIN },
      forceNew: true,
    });

    try {
      await new Promise((resolve, reject) => {
        wsSocket.on('connect', resolve);
        wsSocket.on('connect_error', reject);
      });

      assert.ok(wsSocket.connected, 'WebSocket transport connects successfully over LAN IP');
      assert.equal(wsSocket.io.engine.transport.name, 'websocket', 'Active transport must be websocket');
    } finally {
      wsSocket.disconnect();
    }
  });

  it('Verifies Polling transport explicitly over LAN IP', async () => {
    const pollingSocket = io(BACKEND_LAN_URL, {
      transports: ['polling'],
      extraHeaders: { Origin: FRONTEND_LAN_ORIGIN },
      forceNew: true,
    });

    try {
      await new Promise((resolve, reject) => {
        pollingSocket.on('connect', resolve);
        pollingSocket.on('connect_error', reject);
      });

      assert.ok(pollingSocket.connected, 'Polling transport connects successfully over LAN IP');
      assert.equal(pollingSocket.io.engine.transport.name, 'polling', 'Active transport must be polling');
    } finally {
      pollingSocket.disconnect();
    }
  });

  it('Executes complete two-player Movie Guess flow: Lobby start -> Role-aware screen sync -> Story broadcast -> Guesser challenge & submission -> Round resolution', async () => {
    const socketHost = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      extraHeaders: { Origin: 'http://localhost:5173' },
      forceNew: true,
    });

    const socketLanClient = io(BACKEND_LAN_URL, {
      transports: ['websocket', 'polling'],
      extraHeaders: { Origin: FRONTEND_LAN_ORIGIN },
      forceNew: true,
    });

    try {
      await Promise.all([
        new Promise((resolve) => socketHost.once('connect', resolve)),
        new Promise((resolve) => socketLanClient.once('connect', resolve)),
      ]);

      // 1. Host creates a Movie Guess room
      const roomCreatedPromise = new Promise((resolve) => socketHost.once('room:created', resolve));
      socketHost.emit('room:create', {
        hostId: 'host-player-1',
        hostName: 'Host Player',
        mode: 'movieGuess',
      });
      const room = await roomCreatedPromise;
      assert.ok(room.roomCode, 'Room code generated');
      assert.equal(room.mode, 'movieGuess');

      // 2. Player 2 joins room over LAN
      const p1JoinPromise = new Promise((resolve) => socketHost.once('room:updated', resolve));
      const p2JoinPromise = new Promise((resolve) => socketLanClient.once('room:updated', resolve));
      socketLanClient.emit('room:join', {
        roomCode: room.roomCode,
        playerId: 'guesser-player-2',
        playerName: 'Guesser Player 2',
      });
      await Promise.all([p1JoinPromise, p2JoinPromise]);

      // 3. Both toggle ready
      const p1ReadyPromise = new Promise((resolve) => socketHost.once('room:updated', resolve));
      socketLanClient.emit('room:toggle_ready', {
        roomCode: room.roomCode,
        playerId: 'guesser-player-2',
      });
      await p1ReadyPromise;

      // 4. Host starts the game: room:start_game
      const hostStartPromise = new Promise((resolve) => socketHost.once('room:game_started', resolve));
      const lanStartPromise = new Promise((resolve) => socketLanClient.once('room:game_started', resolve));
      socketHost.emit('room:start_game', {
        roomCode: room.roomCode,
        hostId: 'host-player-1',
      });

      const [hostStartedRoom, lanStartedRoom] = await Promise.all([hostStartPromise, lanStartPromise]);
      assert.equal(hostStartedRoom.status, 'playing', 'Room status updated to playing');
      assert.equal(lanStartedRoom.status, 'playing', 'Player 2 receives game_started with status playing');

      // 5. Both clients navigate to game and request state via movie_guess:get_state
      const hostStatePromise = new Promise((resolve) => socketHost.once('movie_guess:state', resolve));
      const p2StatePromise = new Promise((resolve) => socketLanClient.once('movie_guess:state', resolve));

      socketHost.emit('movie_guess:get_state', {
        roomCode: room.roomCode,
        playerId: 'host-player-1',
      });
      socketLanClient.emit('movie_guess:get_state', {
        roomCode: room.roomCode,
        playerId: 'guesser-player-2',
      });

      const [hostInitialState, p2InitialState] = await Promise.all([hostStatePromise, p2StatePromise]);
      assert.equal(hostInitialState.isHost, true, 'Host recognized as host');
      assert.equal(hostInitialState.gameState, 'setup', 'Host initial state is setup');
      assert.equal(p2InitialState.isHost, false, 'Player 2 recognized as challenger');
      assert.equal(p2InitialState.gameState, 'waiting_host', 'Player 2 initial state is waiting_host');
      assert.equal(p2InitialState.secretMovie, undefined, 'Player 2 must NOT receive secret movie information before round');

      // 6. Host sets up mystery puzzle: movie_guess:setup_round
      const p1StoryPromise = new Promise((resolve) => socketHost.once('movie_guess:story_ready', resolve));
      const p2StoryPromise = new Promise((resolve) => socketLanClient.once('movie_guess:story_ready', resolve));
      const hostSecretPromise = new Promise((resolve) => socketHost.once('movie_guess:host_round_ready', resolve));

      socketHost.emit('movie_guess:setup_round', {
        roomCode: room.roomCode,
        movieId: 'vikram-2022',
        whatIfPrompt: 'What if Tina had not neutralized the squad before Vikram intervened?',
      });

      const [p1Story, p2Story, hostSecret] = await Promise.all([p1StoryPromise, p2StoryPromise, hostSecretPromise]);
      assert.ok(p1Story.mysteryStory, 'Mystery story generated');
      assert.equal(p1Story.mysteryStory, p2Story.mysteryStory, 'Same story delivered to both clients');
      assert.equal(p2Story.secretMovie, undefined, 'Secret movie must NOT be sent in public story_ready event');
      assert.ok(hostSecret.secretMovie.title.toLowerCase().includes('vikram'), 'Host receives secret movie confirmation privately');

      // 7. Player 2 unlocks next hint
      const hintPromise = new Promise((resolve) => socketLanClient.once('movie_guess:hint_unlocked', resolve));
      socketLanClient.emit('movie_guess:unlock_hint', { roomCode: room.roomCode });
      const hintData = await hintPromise;
      assert.equal(hintData.hintsUnlocked, 2, 'Clues unlocked increments to 2');
      assert.equal(hintData.currentPoints, 85, 'Points deducted to 85 for hint unlock');

      // 8. Player 2 submits an incorrect guess
      const wrongGuessPromise = new Promise((resolve) => socketLanClient.once('movie_guess:incorrect_guess', resolve));
      socketLanClient.emit('movie_guess:submit_guess', {
        roomCode: room.roomCode,
        guessText: 'Baahubali The Conclusion',
        guesserPlayerId: 'guesser-player-2',
      });
      const wrongGuessData = await wrongGuessPromise;
      assert.equal(wrongGuessData.remainingPoints, 75, 'Points deducted to 75 for wrong guess');
      assert.equal(wrongGuessData.guessHistory.length, 1, 'Guess history contains 1 attempt');
      assert.equal(wrongGuessData.guessHistory[0].isCorrect, false, 'Guess is marked false');

      // 9. Player 2 submits correct guess: "Vikram"
      const p1ResolvedPromise = new Promise((resolve) => socketHost.once('movie_guess:round_resolved', resolve));
      const p2ResolvedPromise = new Promise((resolve) => socketLanClient.once('movie_guess:round_resolved', resolve));

      socketLanClient.emit('movie_guess:submit_guess', {
        roomCode: room.roomCode,
        guessText: 'Vikram',
        guesserPlayerId: 'guesser-player-2',
      });

      const [p1Resolved, p2Resolved] = await Promise.all([p1ResolvedPromise, p2ResolvedPromise]);
      assert.equal(p1Resolved.isCorrect, true, 'Host receives round resolved with isCorrect=true');
      assert.equal(p2Resolved.isCorrect, true, 'Guesser receives round resolved with isCorrect=true');
      assert.equal(p2Resolved.pointsAwarded, 75, 'Points awarded correctly to guesser');
      assert.equal(p2Resolved.secretMovie.title, 'Vikram', 'Secret movie revealed on resolution');

      // 10. Verify state recovery on refresh/sync after resolution
      const syncPromise = new Promise((resolve) => socketLanClient.once('movie_guess:state', resolve));
      socketLanClient.emit('movie_guess:get_state', {
        roomCode: room.roomCode,
        playerId: 'guesser-player-2',
      });
      const syncedState = await syncPromise;
      assert.equal(syncedState.gameState, 'resolved', 'State recovers as resolved on refresh');
      assert.equal(syncedState.isSolved, true, 'State indicates solved');

      // 11. Host triggers next round
      const nextRoundPromise = new Promise((resolve) => socketLanClient.once('movie_guess:round_reset', resolve));
      socketHost.emit('movie_guess:next_round', { roomCode: room.roomCode });
      const nextRoundData = await nextRoundPromise;
      assert.equal(nextRoundData.currentRoundNumber, 2, 'Next round number incremented to 2');

    } finally {
      socketHost.disconnect();
      socketLanClient.disconnect();
    }
  });

  it('Executes complete Mystery Movie Challenge (Feature 2): Host enters only movie title -> Genuine RAG retrieves chunks -> Simple English story generated -> Player 2 guesses -> Round resolves', async () => {
    const socketHost = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      extraHeaders: { Origin: 'http://localhost:5173' },
      forceNew: true,
    });

    const socketLanClient = io(BACKEND_LAN_URL, {
      transports: ['websocket', 'polling'],
      extraHeaders: { Origin: FRONTEND_LAN_ORIGIN },
      forceNew: true,
    });

    try {
      await Promise.all([
        new Promise((resolve) => socketHost.once('connect', resolve)),
        new Promise((resolve) => socketLanClient.once('connect', resolve)),
      ]);

      // 1. Host creates a Mystery Movie Challenge room (no what-if prompt required)
      const roomCreatedPromise = new Promise((resolve) => socketHost.once('room:created', resolve));
      socketHost.emit('room:create', {
        hostId: 'host-mystery-p1',
        hostName: 'Host Mystery Master',
        mode: 'mysteryMovie',
      });
      const room = await roomCreatedPromise;
      assert.ok(room.roomCode, 'Room code generated');
      assert.equal(room.mode, 'mysteryMovie', 'Mode set to mysteryMovie');

      // 2. Player 2 joins room over LAN
      const p1JoinPromise = new Promise((resolve) => socketHost.once('room:updated', resolve));
      const p2JoinPromise = new Promise((resolve) => socketLanClient.once('room:updated', resolve));
      socketLanClient.emit('room:join', {
        roomCode: room.roomCode,
        playerId: 'guesser-mystery-p2',
        playerName: 'Guesser Detective',
      });
      await Promise.all([p1JoinPromise, p2JoinPromise]);

      // 3. Player 2 toggles ready
      const p1ReadyPromise = new Promise((resolve) => socketHost.once('room:updated', resolve));
      socketLanClient.emit('room:toggle_ready', {
        roomCode: room.roomCode,
        playerId: 'guesser-mystery-p2',
      });
      await p1ReadyPromise;

      // 4. Host starts the game: room:start_game
      const hostStartPromise = new Promise((resolve) => socketHost.once('room:game_started', resolve));
      const lanStartPromise = new Promise((resolve) => socketLanClient.once('room:game_started', resolve));
      socketHost.emit('room:start_game', {
        roomCode: room.roomCode,
        hostId: 'host-mystery-p1',
      });

      const [hostStartedRoom, lanStartedRoom] = await Promise.all([hostStartPromise, lanStartPromise]);
      assert.equal(hostStartedRoom.status, 'playing', 'Room status updated to playing');
      assert.equal(lanStartedRoom.status, 'playing', 'Player 2 receives game_started');

      // 5. Both check state
      const hostStatePromise = new Promise((resolve) => socketHost.once('movie_guess:state', resolve));
      const p2StatePromise = new Promise((resolve) => socketLanClient.once('movie_guess:state', resolve));

      socketHost.emit('movie_guess:get_state', {
        roomCode: room.roomCode,
        playerId: 'host-mystery-p1',
      });
      socketLanClient.emit('movie_guess:get_state', {
        roomCode: room.roomCode,
        playerId: 'guesser-mystery-p2',
      });

      const [hostState, p2State] = await Promise.all([hostStatePromise, p2StatePromise]);
      assert.equal(hostState.mode, 'mysteryMovie');
      assert.equal(hostState.isHost, true);
      assert.equal(p2State.mode, 'mysteryMovie');
      assert.equal(p2State.isHost, false);
      assert.equal(p2State.gameState, 'waiting_host');
      assert.equal(p2State.secretMovie, undefined, 'No movie leak to Player 2 before round');

      // 6. Host sets up mystery puzzle providing ONLY the movie title "Maanaadu" (no What-If prompt!)
      const p1StoryPromise = new Promise((resolve) => socketHost.once('movie_guess:story_ready', resolve));
      const p2StoryPromise = new Promise((resolve) => socketLanClient.once('movie_guess:story_ready', resolve));
      const hostSecretPromise = new Promise((resolve) => socketHost.once('movie_guess:host_round_ready', resolve));

      socketHost.emit('movie_guess:setup_round', {
        roomCode: room.roomCode,
        movieTitle: 'Maanaadu',
        mode: 'mysteryMovie',
      });

      const [p1Story, p2Story, hostSecret] = await Promise.all([p1StoryPromise, p2StoryPromise, hostSecretPromise]);
      assert.ok(p1Story.mysteryStory, 'RAG-generated mystery story received');
      assert.equal(p1Story.mode, 'mysteryMovie', 'Event indicates mysteryMovie mode');
      assert.equal(p1Story.mysteryStory, p2Story.mysteryStory, 'Synchronized story received by both');
      assert.equal(p2Story.secretMovie, undefined, 'No secret movie leaked in public event');
      assert.equal(hostSecret.secretMovie.title, 'Maanaadu', 'Host receives secret movie confirmation');

      // 7. Player 2 unlocks next hint
      const hintPromise = new Promise((resolve) => socketLanClient.once('movie_guess:hint_unlocked', resolve));
      socketLanClient.emit('movie_guess:unlock_hint', { roomCode: room.roomCode });
      const hintData = await hintPromise;
      assert.equal(hintData.hintsUnlocked, 2);
      assert.equal(hintData.currentPoints, 85);

      // 8. Player 2 submits an incorrect guess ("Kaithi")
      const wrongGuessPromise = new Promise((resolve) => socketLanClient.once('movie_guess:incorrect_guess', resolve));
      socketLanClient.emit('movie_guess:submit_guess', {
        roomCode: room.roomCode,
        guessText: 'Kaithi',
        guesserPlayerId: 'guesser-mystery-p2',
      });
      const wrongData = await wrongGuessPromise;
      assert.equal(wrongData.remainingPoints, 75);
      assert.equal(wrongData.guessHistory.length, 1);
      assert.equal(wrongData.guessHistory[0].isCorrect, false);

      // 9. Player 2 submits correct guess ("Maanadu")
      const p1ResolvedPromise = new Promise((resolve) => socketHost.once('movie_guess:round_resolved', resolve));
      const p2ResolvedPromise = new Promise((resolve) => socketLanClient.once('movie_guess:round_resolved', resolve));

      socketLanClient.emit('movie_guess:submit_guess', {
        roomCode: room.roomCode,
        guessText: 'Maanadu',
        guesserPlayerId: 'guesser-mystery-p2',
      });

      const [p1Resolved, p2Resolved] = await Promise.all([p1ResolvedPromise, p2ResolvedPromise]);
      assert.equal(p1Resolved.isCorrect, true);
      assert.equal(p2Resolved.isCorrect, true);
      assert.equal(p2Resolved.pointsAwarded, 75);
      assert.equal(p2Resolved.secretMovie.title, 'Maanaadu');
      assert.equal(p2Resolved.secretMovie.director, 'Venkat Prabhu');

    } finally {
      socketHost.disconnect();
      socketLanClient.disconnect();
    }
  });

  it('Rejects unsupported movies with helpful error message and supported movies list', async () => {
    const socketHost = io('http://localhost:5000', {
      transports: ['websocket'],
      extraHeaders: { Origin: 'http://localhost:5173' },
      forceNew: true,
    });

    try {
      await new Promise((resolve) => socketHost.once('connect', resolve));

      // 1. Create room
      const roomCreatedPromise = new Promise((resolve) => socketHost.once('room:created', resolve));
      socketHost.emit('room:create', {
        hostId: 'host-err-test',
        hostName: 'Host Error Tester',
        mode: 'mysteryMovie',
      });
      const room = await roomCreatedPromise;

      // 2. Attempt setup with unsupported movie
      const errorPromise = new Promise((resolve) => socketHost.once('error', resolve));
      socketHost.emit('movie_guess:setup_round', {
        roomCode: room.roomCode,
        movieTitle: 'Avatar The Way of Water 99',
        mode: 'mysteryMovie',
      });

      const errData = await errorPromise;
      assert.ok(errData.message.includes('not yet in our database'), 'Error mentions movie not in database');
      assert.ok(Array.isArray(errData.supportedMovies), 'Returns list of supported movies');
      assert.ok(errData.supportedMovies.includes('Vikram'), 'Lists Vikram as supported');
      assert.ok(errData.supportedMovies.includes('Maanaadu'), 'Lists Maanaadu as supported');

    } finally {
      socketHost.disconnect();
    }
  });

});
