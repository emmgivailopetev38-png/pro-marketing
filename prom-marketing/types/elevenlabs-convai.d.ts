// Говорителят на ElevenLabs е custom element — React не го знае по рождение.
// В React 19 разширението върви през модула "react", не през глобалния JSX.
import "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "agent-id"?: string;
          "signed-url"?: string;
        },
        HTMLElement
      >;
    }
  }
}
