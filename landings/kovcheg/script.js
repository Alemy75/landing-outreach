const observer=new IntersectionObserver((entries)=>entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach((el)=>observer.observe(el));
if(window.lucide){window.lucide.createIcons({attrs:{'stroke-width':1.8}})}
const flowObserver=new IntersectionObserver((entries)=>entries.forEach((entry)=>{if(entry.isIntersecting){entry.target.classList.add('active')}else{entry.target.classList.remove('active')}}),{threshold:.2});document.querySelectorAll('.flow-divider').forEach((el)=>flowObserver.observe(el));
const nav=document.querySelector('.nav');const updateNav=()=>nav?.classList.toggle('is-scrolled',window.scrollY>18);updateNav();window.addEventListener('scroll',updateNav,{passive:true});
const navToggle=document.querySelector('.nav-toggle');
if(nav&&navToggle){
  const setMenuOpen=(open)=>{
    nav.classList.toggle('is-open',open);
    navToggle.setAttribute('aria-expanded',String(open));
    navToggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');
  };
  navToggle.addEventListener('click',()=>setMenuOpen(navToggle.getAttribute('aria-expanded')!=='true'));
  nav.querySelectorAll('.nav-links a').forEach((link)=>link.addEventListener('click',()=>setMenuOpen(false)));
  document.addEventListener('pointerdown',(event)=>{if(!nav.contains(event.target))setMenuOpen(false)});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape'&&nav.classList.contains('is-open')){setMenuOpen(false);navToggle.focus()}});
  window.addEventListener('resize',()=>{if(window.innerWidth>900)setMenuOpen(false)});
}

const collageTabs=Array.from(document.querySelectorAll('.branch-collage-tab'));
if(collageTabs.length){
  const activateBranch=(branch,focus=false)=>{
    collageTabs.forEach((tab)=>{
      const active=tab.dataset.branchTab===branch;
      tab.classList.toggle('is-active',active);
      tab.setAttribute('aria-selected',String(active));
      tab.tabIndex=active?0:-1;
      if(active&&focus)tab.focus();
      const panel=document.getElementById(tab.getAttribute('aria-controls'));
      panel.hidden=!active;
      panel.classList.toggle('is-visible',active);
    });
  };
  collageTabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>activateBranch(tab.dataset.branchTab));
    tab.addEventListener('keydown',(event)=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?0:event.key==='End'?collageTabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+collageTabs.length)%collageTabs.length;
      activateBranch(collageTabs[next].dataset.branchTab,true);
    });
  });
}

const reviewsSlider=document.querySelector('#reviews-slider');
if(reviewsSlider){
  if(window.Splide){
    new window.Splide(reviewsSlider,{
      type:'slide',perPage:3,perMove:1,gap:'16px',rewind:true,
      arrows:true,pagination:true,drag:true,autoplay:false,
      speed:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:600,
      i18n:{prev:'Предыдущие отзывы',next:'Следующие отзывы',first:'Первый отзыв',last:'Последний отзыв',pageX:'Страница %s',slideX:'Отзыв %s из %s'},
      breakpoints:{900:{perPage:2},600:{perPage:1}}
    }).mount();
  }else{
    const list=reviewsSlider.querySelector('.splide__list');
    reviewsSlider.querySelectorAll('.splide__arrow').forEach((button)=>{
      button.addEventListener('click',()=>{
        const slide=list.querySelector('.splide__slide');
        const gap=parseFloat(getComputedStyle(list).gap)||0;
        const step=(slide?.getBoundingClientRect().width||list.clientWidth)+gap;
        list.scrollBy({left:button.classList.contains('splide__arrow--next')?step:-step,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
      });
    });
  }
}

const ticker=document.querySelector('.ticker');
const tickerTrack=ticker?.querySelector('.ticker-track');
const tickerGroup=tickerTrack?.querySelector('.ticker-group');
const tickerTooltip=document.querySelector('#ticker-tooltip');
if(ticker&&tickerTrack&&tickerGroup&&tickerTooltip){
  const tickerViewport=ticker.querySelector('.ticker-viewport');
  const originalItems=Array.from(tickerGroup.children).map((item)=>item.cloneNode(true));
  let viewportWidth=0;

  let activeItem=null;
  const positionTooltip=()=>{
    if(!activeItem||tickerTooltip.hidden)return;
    const rect=activeItem.getBoundingClientRect();
    const left=Math.max(12,Math.min(window.innerWidth-tickerTooltip.offsetWidth-12,rect.left+rect.width/2-tickerTooltip.offsetWidth/2));
    const above=rect.top-tickerTooltip.offsetHeight-10;
    const placement=above>=12?'top':'bottom';
    tickerTooltip.dataset.placement=placement;
    tickerTooltip.style.left=`${left}px`;
    tickerTooltip.style.top=`${placement==='top'?above:rect.bottom+10}px`;
  };
  const showTooltip=(item)=>{
    if(activeItem&&activeItem!==item)activeItem.removeAttribute('aria-describedby');
    activeItem=item;
    tickerTooltip.textContent=item.dataset.description||'';
    tickerTooltip.hidden=false;
    item.setAttribute('aria-describedby','ticker-tooltip');
    ticker.classList.add('is-paused');
    positionTooltip();
  };
  const hideTooltip=()=>{
    activeItem?.removeAttribute('aria-describedby');
    activeItem=null;
    tickerTooltip.hidden=true;
    ticker.classList.remove('is-paused');
  };
  const buildTicker=()=>{
    hideTooltip();
    viewportWidth=tickerViewport.clientWidth;
    tickerTrack.replaceChildren(tickerGroup);
    tickerGroup.replaceChildren(...originalItems.map((item)=>item.cloneNode(true)));
    let copies=0;
    while(tickerGroup.getBoundingClientRect().width<viewportWidth+1&&copies++<64){
      originalItems.forEach((item)=>{
        const copy=item.cloneNode(true);
        copy.setAttribute('aria-hidden','true');
        copy.tabIndex=-1;
        tickerGroup.append(copy);
      });
    }
    const repeat=tickerGroup.cloneNode(true);
    repeat.setAttribute('aria-hidden','true');
    repeat.querySelectorAll('button').forEach((item)=>item.tabIndex=-1);
    tickerTrack.append(repeat);
    tickerTrack.style.animationDuration=`${tickerGroup.getBoundingClientRect().width/55}s`;
    tickerTrack.querySelectorAll('.ticker-item').forEach((item)=>{
      item.addEventListener('pointerenter',(event)=>{if(event.pointerType!=='touch')showTooltip(item)});
      item.addEventListener('pointerleave',()=>{if(document.activeElement!==item)hideTooltip()});
      item.addEventListener('focus',()=>showTooltip(item));
      item.addEventListener('blur',()=>hideTooltip());
      item.addEventListener('click',()=>showTooltip(item));
    });
  };
  buildTicker();
  document.fonts?.ready.then(buildTicker);
  ticker.addEventListener('pointerleave',()=>{if(!ticker.contains(document.activeElement))hideTooltip()});
  document.addEventListener('pointerdown',(event)=>{if(!ticker.contains(event.target))hideTooltip()});
  document.addEventListener('keydown',(event)=>{if(event.key==='Escape')hideTooltip()});
  window.addEventListener('scroll',positionTooltip,{passive:true});
  window.addEventListener('resize',()=>{
    if(tickerViewport.clientWidth!==viewportWidth)buildTicker();
    positionTooltip();
  });
}
