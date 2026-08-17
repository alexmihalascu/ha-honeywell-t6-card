# Honeywell T6 Card

Animated Home Assistant Lovelace card for Honeywell T6 and T6R thermostats.

## Installation

Add this repository to HACS as a custom **Dashboard** repository and install it.

```yaml
type: custom:honeywell-t6-card
entity: climate.bedroom_thermostat_honeywell_t6_thermostat
name: Honeywell T6R
room: Dormitor
```

The card provides live room and target temperatures, heating state, animated heat feedback, temperature controls, and Heat/Off modes.

The dial mirrors the real T6 Pro: a square touchscreen unit with mode/wifi icons,
a large digital readout, and dedicated up/down buttons beside the screen — not a
rotary dial, which the real device doesn't have. Accent color is Honeywell blue
when idle and switches to warm orange while actively heating.

## License

MIT
