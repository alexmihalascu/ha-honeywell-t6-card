const VERSION = "0.3.0";

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
    // Modelul real T6 Pro e patrat (104x104mm), cu touchscreen si doua butoane
    // fizice sus/jos langa ecran - nu un dial rotund. Vezi honeywellhome.com.
    const ACCENT = heating ? "#ff6d00" : "#1470c4";
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;height:100%}ha-card{height:100%;box-sizing:border-box;overflow:hidden;position:relative;padding:20px;border-radius:26px;background:linear-gradient(160deg,var(--ha-card-background,var(--card-background-color)) 30%,color-mix(in srgb,${ACCENT} 12%,var(--ha-card-background,var(--card-background-color))));transition:background .5s ease}
      ha-card:before{content:"";position:absolute;width:280px;height:280px;border-radius:50%;right:-110px;top:-130px;background:${ACCENT};filter:blur(58px);opacity:${heating ? ".22" : ".08"};animation:${heating ? "breathe 2.4s ease-in-out infinite" : "none"}}@keyframes breathe{50%{transform:scale(1.22);opacity:.32}}
      .head,.title,.status,.modes,.facts,.icons{display:flex;align-items:center}.head{position:relative;justify-content:space-between}.title{gap:11px}.title ha-icon{--mdc-icon-size:30px;color:${ACCENT}}.title strong{display:block;font-size:18px}.title small{opacity:.62}.status{gap:7px;padding:7px 12px;border-radius:99px;font-weight:700;background:color-mix(in srgb,${heating ? ACCENT : active ? "#43a047" : "var(--secondary-text-color)"} 15%,transparent);color:${heating ? "#c95400" : active ? "#2e7d32" : "var(--secondary-text-color)"}}.status i{width:9px;height:9px;border-radius:50%;background:currentColor;animation:${heating ? "pulse 1.5s infinite" : "none"}}@keyframes pulse{70%{box-shadow:0 0 0 10px transparent}0%{box-shadow:0 0 0 0 currentColor}}
      .unit{position:relative;width:220px;margin:16px auto 4px;display:flex;gap:9px;padding:11px;box-sizing:border-box;border-radius:20px;background:radial-gradient(circle at 30% 22%,color-mix(in srgb,var(--card-background-color) 100%,white 6%),color-mix(in srgb,var(--card-background-color) 84%,black 8%));box-shadow:0 1px 0 rgba(255,255,255,.35) inset,0 -6px 14px rgba(0,0,0,.12) inset,0 10px 22px rgba(0,0,0,.16)}
      .screen{flex:1;border-radius:13px;padding:12px;box-sizing:border-box;display:flex;flex-direction:column;background:linear-gradient(160deg,#181b1f,color-mix(in srgb,${ACCENT} 30%,#181b1f));color:#fff;min-height:150px}
      .icons{justify-content:space-between;opacity:.85}.icons ha-icon{--mdc-icon-size:15px;color:${heating ? ACCENT : "#fff"};opacity:${heating ? "1" : ".55"}}.icons .wifi{--mdc-icon-size:14px;opacity:.45;color:#fff}
      .bignum{flex:1;display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:300;letter-spacing:-.02em}.bignum sup{font-size:16px;opacity:.75;margin-left:2px}
      .caption{text-align:center;font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:.05em}
      .btns{display:flex;flex-direction:column;gap:8px;justify-content:center;width:42px}
      .btn{flex:1;border:0;border-radius:10px;background:var(--card-background-color);color:var(--primary-text-color);font-size:17px;cursor:pointer;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.14),0 0 0 1px color-mix(in srgb,var(--secondary-text-color) 14%,transparent) inset}.btn:active{transform:scale(.92)}
      .wordmark{text-align:center;font-size:9px;letter-spacing:.14em;opacity:.4;margin:6px 0 12px;text-transform:uppercase}
      .facts{justify-content:center;gap:30px;margin:4px 0 16px}.fact{text-align:center}.fact b{display:block;font-size:17px}.fact span{font-size:11px;opacity:.62}
      .modes{gap:9px}.mode{flex:1;border:0;border-radius:14px;padding:11px 8px;background:color-mix(in srgb,var(--secondary-text-color) 9%,transparent);color:var(--primary-text-color);font-weight:700;cursor:pointer}.mode.active{color:white;background:${ACCENT}}.mode ha-icon{--mdc-icon-size:18px;vertical-align:middle;margin-right:5px}
    </style><ha-card>
      <div class="head"><div class="title"><ha-icon icon="mdi:radiator"></ha-icon><div><strong>${this.config.name}</strong><small>${this.config.room}</small></div></div><div class="status"><i></i>${label}</div></div>
      <div class="unit">
        <div class="screen">
          <div class="icons"><ha-icon icon="mdi:fire"></ha-icon><ha-icon class="wifi" icon="mdi:wifi"></ha-icon></div>
          <div class="bignum">${target.toFixed(1)}<sup>°C</sup></div>
          <div class="caption">temperatură setată</div>
        </div>
        <div class="btns"><button class="btn plus">▲</button><button class="btn minus">▼</button></div>
      </div>
      <div class="wordmark">Honeywell</div>
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
