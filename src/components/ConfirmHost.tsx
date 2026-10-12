import { useEffect, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Button } from './Button';
import { Heading, Txt } from './Text';
import { attachConfirmHost, type ConfirmRequest } from '../lib/confirm';
import { palette, withAlpha } from '../theme';

/**
 * Where `confirmAction` and `notify` draw on the web — see lib/confirm.ts.
 *
 * An `alertdialog`, so a screen reader announces it as a question needing an
 * answer, and a modal, so focus stays inside it and Escape answers "Cancel".
 * The safe choice is the first button: it is the one a learner reaches first,
 * and the one Escape and a tap outside the card both choose.
 */
export function ConfirmHost() {
  const [req, setReq] = useState<ConfirmRequest | null>(null);
  useEffect(() => attachConfirmHost(setReq), []);

  const close = () => setReq(null);
  const confirm = () => {
    const r = req;
    setReq(null);
    r?.onConfirm();
  };

  return (
    <Modal visible={req != null} transparent animationType="fade" onRequestClose={close}>
      <Pressable
        accessible={false}
        onPress={close}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: withAlpha(palette.ink, 0.8),
        }}
      >
        {req ? (
          // A Pressable that does nothing, so a tap on the card does not fall
          // through to the backdrop and close it.
          <Pressable
            accessible={false}
            onPress={() => {}}
            style={{ width: '100%', maxWidth: 380, cursor: 'auto' } as never}
          >
            <View
              accessibilityRole={'alertdialog' as never}
              aria-modal
              aria-label={req.title}
              className="rounded-3xl p-6"
              style={{ backgroundColor: palette.ink700, borderWidth: 1, borderColor: withAlpha(palette.gold, 0.25) }}
            >
              <Heading className="mb-2 text-xl">{req.title}</Heading>
              <Txt className="mb-6 text-sm leading-6 text-paper/75">{req.message}</Txt>
              <View className="gap-3">
                {req.confirmLabel ? (
                  <>
                    <Button variant="secondary" onPress={close}>
                      Cancel
                    </Button>
                    <Button variant={req.destructive ? 'incorrect' : 'primary'} onPress={confirm}>
                      {req.confirmLabel}
                    </Button>
                  </>
                ) : (
                  <Button onPress={close}>OK</Button>
                )}
              </View>
            </View>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}
