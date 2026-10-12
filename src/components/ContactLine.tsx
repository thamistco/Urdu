import { Linking } from 'react-native';
import { Txt } from './Text';
import { SUPPORT_EMAIL, isRealAddress } from '../lib/contact';

/**
 * Whether there is an address to show at all. Until the owner sets one, the
 * pages leave their Contact section out: they showed the raw placeholder
 * "{{SUPPORT_EMAIL}}" to every reader (tester report, 2026-10-12), and an
 * address cannot be made up.
 */
export const HAS_CONTACT = isRealAddress(SUPPORT_EMAIL);

/**
 * The Contact line shared by the Privacy Policy and the Terms: "Questions about
 * this policy: <address>". Rendered inside the pages' own paragraph text, so it
 * is text, not a block. The address becomes a mail link once it is a real one
 * and stays plain text while it is the placeholder, so nobody taps into a
 * broken draft.
 */
export function ContactLine({ about }: { about: string }) {
  const real = isRealAddress(SUPPORT_EMAIL);
  return (
    <>
      {`Questions about ${about}: `}
      {real ? (
        <Txt
          accessibilityRole="link"
          accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          className="text-gold underline"
        >
          {SUPPORT_EMAIL}
        </Txt>
      ) : (
        SUPPORT_EMAIL
      )}
    </>
  );
}
