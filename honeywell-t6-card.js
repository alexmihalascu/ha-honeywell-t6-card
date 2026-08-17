const VERSION = "0.2.0";

class HoneywellT6Card extends HTMLElement {
  setConfig(config) {
    if (!config?.entity) throw new Error("Definește entitatea climate pentru Honeywell T6");
    this.config = { name: "Honeywell T6R", room: "Dormitor", step: 0.5, ...config };
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) { this._hass = hass; this.render(); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: 8, min_columns: 6, min_rows: 7 }; }

  state() { return this._hass?.states[this.config.entity]; }
  current() { return Number(this.state()?.attributes.current_temperature); }
  target() {
    const value = Number(this.state()?.attributes.temperature);
    return Number.isFinite(value) && value > 0 ? value : this.current();
  }
  heating() { return this.state()?.attributes.hvac_action === "heating"; }
  mode() { return this.state()?.state || "off"; }

  async setMode(mode) {
    await this._hass.callService("climate", "set_hvac_mode", { entity_id: this.config.entity, hvac_mode: mode });
  }
  async changeTarget(delta) {
    const temperature = Math.round((this.target() + delta) * 2) / 2;
    if (this.mode() === "off") await this.setMode("heat");
    await this._hass.callService("climate", "set_temperature", { entity_id: this.config.entity, temperature });
  }

  render() {
    const s = this.state();
    if (!s || !this.shadowRoot) return;
    const current = this.current();
    const target = this.target();
    const mode = this.mode();
    const heating = this.heating();
    const active = mode === "heat";
    const label = heating ? "Încălzește" : active ? "În așteptare" : "Oprit";
    const min = Number(s.attributes.min_temp ?? 5);
    const max = Number(s.attributes.max_temp ?? 35);
    const pct = Math.max(0, Math.min(100, ((target - min) / (max - min)) * 100));
    // Identitate de brand fixa (cupru/portocaliu), indiferent de tema HA - un
    // termostat fizic Honeywell nu isi schimba culoarea dupa cine il priveste.
    const ACCENT = heating ? "#ff6d00" : "#c9812f";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;height:100%}ha-card{height:100%;box-sizing:border-box;overflow:hidden;position:relative;padding:20px;border-radius:26px;background:linear-gradient(160deg,var(--ha-card-background,var(--card-background-color)) 30%,color-mix(in srgb,${ACCENT} 12%,var(--ha-card-background,var(--card-background-color))));transition:background .5s ease}
      ha-card:before{content:"";position:absolute;width:280px;height:280px;border-radius:50%;right:-110px;top:-130px;background:${ACCENT};filter:blur(58px);opacity:${heating ? ".22" : ".08"};animation:${heating ? "breathe 2.4s ease-in-out infinite" : "none"}}@keyframes breathe{50%{transform:scale(1.22);opacity:.32}}
      .head,.title,.status,.controls,.modes,.facts{display:flex;align-items:center}.head{position:relative;justify-content:space-between}.title{gap:11px}.title ha-icon{--mdc-icon-size:30px;color:${ACCENT}}.title strong{display:block;font-size:18px}.title small{opacity:.62}.status{gap:7px;padding:7px 12px;border-radius:99px;font-weight:700;background:color-mix(in srgb,${heating ? ACCENT : active ? "#43a047" : "var(--secondary-text-color)"} 15%,transparent);color:${heating ? "#c95400" : active ? "#2e7d32" : "var(--secondary-text-color)"}}.status i{width:9px;height:9px;border-radius:50%;background:currentColor;animation:${heating ? "pulse 1.5s infinite" : "none"}}@keyframes pulse{70%{box-shadow:0 0 0 10px transparent}0%{box-shadow:0 0 0 0 currentColor}}
      .dial{position:relative;width:230px;height:230px;margin:18px auto 10px;display:grid;place-items:center;border-radius:50%;background:radial-gradient(circle at 32% 26%,color-mix(in srgb,var(--card-background-color) 100%,white 6%),color-mix(in srgb,var(--card-background-color) 84%,black 10%));box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 -8px 16px rgba(0,0,0,.14) inset,0 10px 24px rgba(0,0,0,.16)}
      .ring{position:absolute;inset:9px;border-radius:50%;background:conic-gradient(from 225deg,${ACCENT} calc(${pct} * .75%),color-mix(in srgb,var(--secondary-text-color) 16%,transparent) 0 75%,transparent 0);mask:radial-gradient(circle,transparent 60%,#000 61%);transition:background .7s ease}
      .bezel{position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 1px color-mix(in srgb,var(--secondary-text-color) 14%,transparent) inset,0 1px 2px rgba(255,255,255,.5) inset;pointer-events:none}
      .center{text-align:center;z-index:1}.flame{height:32px;color:${ACCENT};animation:${heating ? "flame .75s ease-in-out infinite alternate" : "none"};opacity:${heating ? "1" : ".28"}}@keyframes flame{to{transform:translateY(-3px) scale(1.12);filter:drop-shadow(0 0 8px #ff8a00)}}.target{font-size:58px;font-weight:300;line-height:1;letter-spacing:-.02em}.target sup{font-size:19px}.caption{font-size:12px;opacity:.64;margin-top:6px}
      .controls{position:absolute;inset:50% -2px auto;transform:translateY(-50%);justify-content:space-between}.control{border:0;width:50px;height:50px;border-radius:50%;background:var(--card-background-color);color:var(--primary-text-color);font-size:26px;cursor:pointer;transition:.2s;box-shadow:0 2px 6px rgba(0,0,0,.14),0 0 0 1px color-mix(in srgb,var(--secondary-text-color) 14%,transparent) inset}.control:active{transform:scale(.9)}
      .facts{justify-content:center;gap:30px;margin:4px 0 16px}.fact{text-align:center}.fact b{display:block;font-size:17px}.fact span{font-size:11px;opacity:.62}
      .modes{gap:9px}.mode{flex:1;border:0;border-radius:14px;padding:11px 8px;background:color-mix(in srgb,var(--secondary-text-color) 9%,transparent);color:var(--primary-text-color);font-weight:700;cursor:pointer}.mode.active{color:white;background:${ACCENT}}.mode ha-icon{--mdc-icon-size:18px;vertical-align:middle;margin-right:5px}
    </style><ha-card>
      <div class="head"><div class="title"><ha-icon icon="mdi:radiator"></ha-icon><div><strong>${this.config.name}</strong><small>${this.config.room}</small></div></div><div class="status"><i></i>${label}</div></div>
      <div class="dial"><div class="ring"></div><div class="bezel"></div><div class="controls"><button class="control minus">−</button><button class="control plus">+</button></div><div class="center"><ha-icon class="flame" icon="mdi:fire"></ha-icon><div class="target">${target.toFixed(1)}<sup>°C</sup></div><div class="caption">temperatură setată</div></div></div>
      <div class="facts"><div class="fact"><b>${Number.isFinite(current) ? current.toFixed(1) : "—"}°C</b><span>În cameră</span></div><div class="fact"><b>${heating ? "Pornită" : "Oprită"}</b><span>Centrala</span></div></div>
      <div class="modes"><button class="mode heat ${mode === "heat" ? "active" : ""}"><ha-icon icon="mdi:fire"></ha-icon>Încălzire</button><button class="mode off ${mode === "off" ? "active" : ""}"><ha-icon icon="mdi:power"></ha-icon>Oprit</button></div>
    </ha-card>`;
    this.shadowRoot.querySelector(".minus").onclick = () => this.changeTarget(-this.config.step);
    this.shadowRoot.querySelector(".plus").onclick = () => this.changeTarget(this.config.step);
    this.shadowRoot.querySelector(".heat").onclick = () => this.setMode("heat");
    this.shadowRoot.querySelector(".off").onclick = () => this.setMode("off");
  }
}

customElements.define("honeywell-t6-card", HoneywellT6Card);
window.customCards = window.customCards || [];
window.customCards.push({ type:"honeywell-t6-card", name:"Honeywell T6 Card", description:"Card animat pentru termostatul Honeywell T6/T6R" });
console.info(`%c HONEYWELL-T6-CARD %c v${VERSION} `,"color:white;background:#ef6c00;font-weight:700","color:#ef6c00;background:white");
