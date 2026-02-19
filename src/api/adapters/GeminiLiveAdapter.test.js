import test from 'node:test';
import assert from 'node:assert';
import { GeminiLiveAdapter } from './GeminiLiveAdapter.js';

test('GeminiLiveAdapter - handleIncomingMessage', async (t) => {
    const adapter = new GeminiLiveAdapter({ apiKey: 'test-key' });

    // helper to collect emitted events
    const events = [];
    adapter.on('content', (event) => events.push(event));

    await t.test('handles setupComplete', () => {
        events.length = 0;
        adapter.handleIncomingMessage({ setupComplete: true });
        assert.deepStrictEqual([...events], [{ type: 'setup_complete' }]);
    });

    await t.test('handles toolCall', () => {
        events.length = 0;
        const toolCall = { functionCalls: [{ name: 'test_tool', args: {} }] };
        adapter.handleIncomingMessage({ toolCall });
        assert.deepStrictEqual([...events], [{ type: 'tool_call', data: toolCall }]);
    });

    await t.test('handles interrupted', () => {
        events.length = 0;
        adapter.handleIncomingMessage({ serverContent: { interrupted: true } });
        assert.deepStrictEqual([...events], [{ type: 'interrupted' }]);
    });

    await t.test('handles turnComplete', () => {
        events.length = 0;
        adapter.handleIncomingMessage({ serverContent: { turnComplete: true } });
        assert.deepStrictEqual([...events], [{ type: 'turn_complete' }]);
    });

    await t.test('handles inputTranscription', () => {
        events.length = 0;
        const transcription = { text: 'hello' };
        adapter.handleIncomingMessage({ serverContent: { inputTranscription: transcription } });
        assert.deepStrictEqual([...events], [{ type: 'input_transcription', data: transcription }]);
    });

    await t.test('handles outputTranscription', () => {
        events.length = 0;
        const transcription = { text: 'hi there' };
        adapter.handleIncomingMessage({ serverContent: { outputTranscription: transcription } });
        assert.deepStrictEqual([...events], [{ type: 'output_transcription', data: transcription }]);
    });

    await t.test('handles modelTurn parts - text', () => {
        events.length = 0;
        adapter.handleIncomingMessage({
            serverContent: {
                modelTurn: {
                    parts: [{ text: 'response text' }]
                },
                turnComplete: false
            }
        });
        assert.deepStrictEqual([...events], [{
            type: 'text',
            data: 'response text',
            endOfTurn: false
        }]);
    });

    await t.test('handles modelTurn parts - audio (inlineData)', () => {
        events.length = 0;
        adapter.handleIncomingMessage({
            serverContent: {
                modelTurn: {
                    parts: [{ inlineData: { data: 'base64audio' } }]
                },
                turnComplete: true
            }
        });
        assert.deepStrictEqual([...events], [
            { type: 'turn_complete' },
            {
                type: 'audio',
                data: 'base64audio',
                endOfTurn: true
            }
        ]);
    });

    await t.test('handles modelTurn parts - skips thought', () => {
        events.length = 0;
        adapter.handleIncomingMessage({
            serverContent: {
                modelTurn: {
                    parts: [
                        { thought: 'thinking...' },
                        { text: 'actual response' }
                    ]
                },
                turnComplete: true
            }
        });
        assert.deepStrictEqual([...events], [
            { type: 'turn_complete' },
            {
                type: 'text',
                data: 'actual response',
                endOfTurn: true
            }
        ]);
    });

    await t.test('handles complex multi-part message', () => {
        events.length = 0;
        adapter.handleIncomingMessage({
            setupComplete: true,
            serverContent: {
                inputTranscription: { text: 'input' },
                modelTurn: {
                    parts: [{ text: 'output part 1' }, { text: 'output part 2' }]
                },
                turnComplete: true
            }
        });
        // Check order based on implementation: setupComplete -> turnComplete -> inputTranscription -> modelTurn.parts
        assert.deepStrictEqual([...events], [
            { type: 'setup_complete' },
            { type: 'turn_complete' },
            { type: 'input_transcription', data: { text: 'input' } },
            { type: 'text', data: 'output part 1', endOfTurn: true },
            { type: 'text', data: 'output part 2', endOfTurn: true }
        ]);
    });
});
