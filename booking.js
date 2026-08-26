(function(){
  const PRICE = 165;
  const MIN_G = 2;
  const MAX_G = 6;
  const WEEK = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  const today = startOfDay(new Date());
  const blocked = buildBlocked(today);

  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  let checkIn = null;
  let checkOut = null;
  let hover = null;
  let guests = 2;
  let picking = 'in';

  const elMonths = document.getElementById('calMonths');
  const elIn = document.getElementById('labelIn');
  const elOut = document.getElementById('labelOut');
  const elHint = document.getElementById('calHint');
  const elSum = document.getElementById('bookSummary');
  const elNights = document.getElementById('sumNights');
  const elTotal = document.getElementById('sumTotal');
  const elSubmit = document.getElementById('bookSubmit');
  const elGuests = document.getElementById('guestCount');
  const elMinus = document.getElementById('guestMinus');
  const elPlus = document.getElementById('guestPlus');
  const elPrev = document.getElementById('calPrev');
  const elNext = document.getElementById('calNext');
  const fields = Array.from(document.querySelectorAll('.book-date-field'));

  function startOfDay(d){
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function iso(d){
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return y+'-'+m+'-'+day;
  }
  function addDays(d, n){
    const x = new Date(d);
    x.setDate(x.getDate()+n);
    return x;
  }
  function same(a,b){
    return a && b && a.getTime() === b.getTime();
  }
  function fmt(d){
    return d.toLocaleDateString('pt-PT', { day:'numeric', month:'short' });
  }
  function nightsCount(){
    if(!checkIn || !checkOut) return 0;
    return Math.round((checkOut - checkIn) / 86400000);
  }
  function inRange(d, a, b){
    if(!a || !b) return false;
    return d > a && d < b;
  }
  function rangeHasBlocked(a, b){
    if(!a || !b) return false;
    for(let d = new Date(a); d < b; d = addDays(d, 1)){
      if(blocked.has(iso(d))) return true;
    }
    return false;
  }
  function buildBlocked(from){
    const set = new Set();
    const ranges = [
      [12, 14],
      [26, 29],
      [40, 43],
      [55, 57],
      [70, 73]
    ];
    ranges.forEach(([s,e]) => {
      for(let i = s; i <= e; i++) set.add(iso(addDays(from, i)));
    });
    return set;
  }

  function setPicking(which){
    picking = which;
    fields.forEach(f => f.classList.toggle('is-active', f.dataset.field === which));
  }

  function selectDay(d){
    if(d < today || blocked.has(iso(d))) return;
    if(picking === 'in' || !checkIn || (checkIn && checkOut)){
      checkIn = d;
      checkOut = null;
      hover = null;
      setPicking('out');
      elHint.textContent = 'Agora escolha o check-out.';
    } else {
      if(d <= checkIn){
        checkIn = d;
        checkOut = null;
        elHint.textContent = 'Agora escolha o check-out.';
      } else if(rangeHasBlocked(checkIn, d)){
        elHint.textContent = 'Há noites indisponíveis neste intervalo. Escolha outras datas.';
        return;
      } else {
        checkOut = d;
        setPicking('in');
        elHint.textContent = 'Intervalo selecionado. Confirme o pedido quando quiser.';
      }
    }
    render();
  }

  function renderMonth(base){
    const y = base.getFullYear();
    const m = base.getMonth();
    const first = new Date(y, m, 1);
    const startWeek = (first.getDay() + 6) % 7;
    const dim = new Date(y, m+1, 0).getDate();
    const end = checkOut || hover;

    const wrap = document.createElement('div');
    wrap.className = 'cal-month';
    wrap.innerHTML = `<h3>${MONTHS[m]} ${y}</h3>
      <div class="cal-week">${WEEK.map(w => `<span>${w}</span>`).join('')}</div>`;
    const grid = document.createElement('div');
    grid.className = 'cal-grid';

    for(let i = 0; i < startWeek; i++){
      const s = document.createElement('span');
      grid.appendChild(s);
    }
    for(let day = 1; day <= dim; day++){
      const d = new Date(y, m, day);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = day;
      const past = d < today;
      const isBlocked = blocked.has(iso(d));
      const isIn = same(d, checkIn);
      const isOut = same(d, checkOut);
      const ranged = inRange(d, checkIn, end);
      if(past) btn.disabled = true;
      if(isBlocked){ btn.classList.add('is-blocked'); btn.disabled = true; }
      if(isIn) btn.classList.add('is-in');
      if(isOut) btn.classList.add('is-out');
      if(ranged) btn.classList.add('is-range');
      if(isIn && isOut) btn.classList.add('is-in','is-out');
      btn.addEventListener('click', () => selectDay(d));
      btn.addEventListener('mouseenter', () => {
        if(checkIn && !checkOut && d > checkIn && !rangeHasBlocked(checkIn, d) && !same(hover, d)){
          hover = d;
          render();
        }
      });
      grid.appendChild(btn);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function render(){
    elMonths.innerHTML = '';
    elMonths.appendChild(renderMonth(view));
    const next = new Date(view.getFullYear(), view.getMonth()+1, 1);
    elMonths.appendChild(renderMonth(next));

    const minView = new Date(today.getFullYear(), today.getMonth(), 1);
    elPrev.disabled = view <= minView;

    elIn.textContent = checkIn ? fmt(checkIn) : 'Adicionar data';
    elOut.textContent = checkOut ? fmt(checkOut) : 'Adicionar data';

    const n = nightsCount();
    if(n > 0){
      elSum.hidden = false;
      elNights.textContent = n + (n === 1 ? ' noite' : ' noites');
      elTotal.textContent = '€' + (n * PRICE);
      elSubmit.disabled = false;
    } else {
      elSum.hidden = true;
      elSubmit.disabled = true;
    }

    elGuests.textContent = guests;
    elMinus.disabled = guests <= MIN_G;
    elPlus.disabled = guests >= MAX_G;
  }

  elPrev.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth()-1, 1);
    render();
  });
  elNext.addEventListener('click', () => {
    view = new Date(view.getFullYear(), view.getMonth()+1, 1);
    render();
  });
  elMinus.addEventListener('click', () => { if(guests > MIN_G){ guests--; render(); } });
  elPlus.addEventListener('click', () => { if(guests < MAX_G){ guests++; render(); } });
  document.getElementById('bookClear').addEventListener('click', () => {
    checkIn = checkOut = hover = null;
    setPicking('in');
    elHint.textContent = 'Selecione o check-in e depois o check-out. Mínimo 1 noite.';
    render();
  });
  fields.forEach(f => f.addEventListener('click', () => setPicking(f.dataset.field)));
  elMonths.addEventListener('mouseleave', () => {
    if(hover){ hover = null; render(); }
  });

  elSubmit.addEventListener('click', () => {
    const n = nightsCount();
    if(n < 1) return;
    const payload = {
      checkIn: iso(checkIn),
      checkOut: iso(checkOut),
      nights: n,
      guests,
      total: n * PRICE,
      at: new Date().toISOString()
    };
    try { localStorage.setItem('pinhal-booking', JSON.stringify(payload)); } catch(e){}
    document.getElementById('bookFlow').hidden = true;
    document.getElementById('bookSuccess').hidden = false;
    document.getElementById('successCopy').textContent =
      `Check-in ${fmt(checkIn)} · Check-out ${fmt(checkOut)} · ${n} ${n===1?'noite':'noites'} · ${guests} hóspedes · total €${n*PRICE}. Entraremos em contacto para confirmar a estadia.`;
  });

  document.getElementById('bookAgain').addEventListener('click', () => {
    document.getElementById('bookSuccess').hidden = true;
    document.getElementById('bookFlow').hidden = false;
    checkIn = checkOut = hover = null;
    setPicking('in');
    elHint.textContent = 'Selecione o check-in e depois o check-out. Mínimo 1 noite.';
    render();
  });

  render();
})();
