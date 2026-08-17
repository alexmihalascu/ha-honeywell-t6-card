const VERSION = "0.1.1";

class HoneywellT6Card extends HTMLElement {
  setConfig(config) {
    if (!config?.entity) throw new Error("Definește entitatea climate pentru Honeywell T6");
    this.config = { name: "Honeywell T6R", room: "Dormitor", step: 0.5, ...config };
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) { this._hass = hass; this.render(); }
  getCardSize() { return 6; }
  getGridOptions() { return { columns: 12, rows: 6, min_columns: 6, min_rows: 5 }; }

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
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;height:100%}ha-card{height:100%;box-sizing:border-box;overflow:hidden;position:relative;padding:18px;border-radius:24px;background:linear-gradient(155deg,var(--ha-card-background,var(--card-background-color)) 35%,color-mix(in srgb,${heating ? "#ff6d00" : "var(--primary-color)"} 13%,var(--ha-card-background,var(--card-background-color))));transition:background .5s ease}
      ha-card:before{content:"";position:absolute;width:260px;height:260px;border-radius:50%;right:-100px;top:-120px;background:${heating ? "#ff8a00" : "var(--primary-color)"};filter:blur(55px);opacity:${heating ? ".19" : ".07"};animation:${heating ? "breathe 2.4s ease-in-out infinite" : "none"}}@keyframes breathe{50%{transform:scale(1.22);opacity:.28}}
      .head,.title,.status,.controls,.modes,.facts{display:flex;align-items:center}.head{position:relative;justify-content:space-between}.title{gap:11px}.title ha-icon{--mdc-icon-size:31px;color:${heating ? "#ff6d00" : "var(--primary-color)"}}.title strong{display:block;font-size:18px}.title small{opacity:.62}.status{gap:7px;padding:7px 11px;border-radius:99px;font-weight:700;background:color-mix(in srgb,${heating ? "#ff6d00" : active ? "#43a047" : "var(--secondary-text-color)"} 14%,transparent);color:${heating ? "#ef6c00" : active ? "#43a047" : "var(--secondary-text-color)"}}.status i{width:9px;height:9px;border-radius:50%;background:currentColor;animation:${heating ? "pulse 1.5s infinite" : "none"}}@keyframes pulse{70%{box-shadow:0 0 0 10px transparent}0%{box-shadow:0 0 0 0 currentColor}}
      .dial{position:relative;width:210px;height:210px;margin:16px auto 8px;display:grid;place-items:center}.ring{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 225deg,${heating ? "#ff6d00" : "var(--primary-color)"} calc(${pct} * .75%),color-mix(in srgb,var(--secondary-text-color) 18%,transparent) 0 75%,transparent 0);mask:radial-gradient(circle,transparent 62%,#000 63%);transition:background .7s ease}.center{text-align:center;z-index:1}.flame{height:30px;color:#ff6d00;animation:${heating ? "flame .75s ease-in-out infinite alternate" : "none"};opacity:${heating ? "1" : ".25"}}@keyframes flame{to{transform:translateY(-3px) scale(1.12);filter:drop-shadow(0 0 8px #ff8a00)}}.target{font-size:52px;font-weight:300;line-height:1}.target sup{font-size:18px}.caption{font-size:12px;opacity:.64;margin-top:5px}
      .controls{position:absolute;inset:50% 3px auto;transform:translateY(-50%);justify-content:space-between}.control{border:0;width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--secondary-text-color) 10%,var(--card-background-color));color:var(--primary-text-color);font-size:25px;cursor:pointer;transition:.2s}.control:active{transform:scale(.9)}
      .facts{justify-content:center;gap:28px;margin:2px 0 15px}.fact{text-align:center}.fact b{display:block;font-size:17px}.fact span{font-size:11px;opacity:.62}
      .modes{gap:9px}.mode{flex:1;border:0;border-radius:14px;padding:11px 8px;background:color-mix(in srgb,var(--secondary-text-color) 9%,transparent);color:var(--primary-text-color);font-weight:700;cursor:pointer}.mode.active{color:white;background:${mode === "heat" ? "#ef6c00" : "var(--primary-color)"}}.mode ha-icon{--mdc-icon-size:18px;vertical-align:middle;margin-right:5px}
      .footer{position:relative;text-align:right;margin-top:10px;font-size:10px;opacity:.45}
    </style><ha-card>
      <div class="head"><div class="title"><ha-icon icon="mdi:radiator"></ha-icon><div><strong>${this.config.name}</strong><small>${this.config.room}</small></div></div><div class="status"><i></i>${label}</div></div>
      <div class="dial"><div class="ring"></div><div class="controls"><button class="control minus">−</button><button class="control plus">+</button></div><div class="center"><ha-icon class="flame" icon="mdi:fire"></ha-icon><div class="target">${target.toFixed(1)}<sup>°C</sup></div><div class="caption">temperatură setată</div></div></div>
      <div class="facts"><div class="fact"><b>${Number.isFinite(current) ? current.toFixed(1) : "—"}°C</b><span>În cameră</span></div><div class="fact"><b>${heating ? "Pornită" : "Oprită"}</b><span>Centrala</span></div></div>
      <div class="modes"><button class="mode heat ${mode === "heat" ? "active" : ""}"><ha-icon icon="mdi:fire"></ha-icon>Încălzire</button><button class="mode off ${mode === "off" ? "active" : ""}"><ha-icon icon="mdi:power"></ha-icon>Oprit</button></div>
      <div class="footer">v${VERSION}</div>
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
