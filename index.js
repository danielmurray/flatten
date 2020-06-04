const gradient = (vector1, vector2, scalar) => {
  return vector1.map((v1, i) => {
    v2 = vector2[i]
    return v1 - ( v1 -  v2) * scalar
  });
}

const color = (stateName, date) => {
  const state = window.state_states[stateName];
  if (!state) {
    return unknown;
  }

  const state_date = state[date];
  if (!state_date) {
    const unknown = 'grey'
    return unknown;
  }

  const receding = [178,230,114]
  const flattening = [255, 253, 136];
  const growing = [255, 212, 120];
  const peak = [249, 107, 133];

  const { growth_factor, ratio } = state_date;

  if (ratio < 0.5) {
    const scalar = ratio / 0.5;
    const rgb = gradient(receding, flattening, scalar);
    return `rgba(${rgb.join(',')},1)`;
  } else {
    const scalar = (ratio - 0.5) / 0.5;
    const rgb = gradient(flattening, peak, scalar);
    return `rgba(${rgb.join(',')},1)`;
  }

  // if (growth_factor < 0.5) {
  //   return `rgba(${receding.join(',')},1)`;
  // } else if (growth_factor < 1) {
  //   const scalar = (growth_factor - 0.5) / 0.5;
  //   const rgb = gradient(receding, flattening, scalar);
  //   return `rgba(${rgb.join(',')},1)`;
  // } else if (growth_factor < 1.5) {
  //   const scalar = (growth_factor - 1.0) / 0.5;
  //   const rgb = gradient(growing, peak, scalar);
  //   return `rgba(${rgb.join(',')},1)`;
  // } else {
  //   return `rgba(${peak.join(',')},1)`;
  // }
}

const firstDate = () => {
  const stateNames = Object.keys(window.state_states);
  const dates =  stateNames.reduce((dates, stateName) => {
    const state = window.state_states[stateName];
    return [
      ...dates,
      ...Object.keys(state)
    ];
  }, []);
  dates.sort();
  return dates[0];
}

const numberOfDays = () => {
  const stateNames =Object.keys(window.state_states);
  return stateNames.reduce((maxNumDays, stateName) => {
    const state = window.state_states[stateName];
    const numDays = Object.keys(state).length;
    if (numDays > maxNumDays) {
      return numDays;
    }
    return maxNumDays;
  }, 0);
}

const indexDate = (dateZero, index) => {
  const date = new Date(`${dateZero}T00:00:00.000Z`);
  date.setTime(date.getTime() + index * 24 * 3600 * 1000);
  return date;
}

const Months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const renderDate = (date) => {
  const wrapperDiv = document.createElement("div");
  wrapperDiv.className = 'dateWrapper';

  const dateDiv = document.createElement("div");
  dateDiv.className = 'date';
  wrapperDiv.appendChild(dateDiv);

  const monthDiv = document.createElement("div");
  monthDiv.className = 'month';
  const month = Months[date.getUTCMonth()];
  const monthText = document.createTextNode(month);
  monthDiv.appendChild(monthText);
  dateDiv.appendChild(monthDiv);

  const dayDiv = document.createElement("div");
  dayDiv.className = 'day';
  const dayText = document.createTextNode(date.getUTCDate());
  dayDiv.appendChild(dayText);
  dateDiv.appendChild(dayDiv);
  return wrapperDiv;
}

const renderDateSlider = (dateZero, numDays) => {
  const dates = Array(numDays).fill().map((_, index) => {
    const date = new Date(`${dateZero}T00:00:00.000Z`);
    date.setTime(date.getTime() + index * 24 * 3600 * 1000);
    return date;
  });

  const dateSlider = document.getElementById("dateSlider");
  dates.forEach((date, i) => {
    const dateDiv = renderDate(date);
    dateSlider.appendChild(dateDiv);
  });

  dateSlider.scrollLeft = dateSlider.scrollWidth;
  return dateSlider;
}

window.main = () => {
  const backButton = document.getElementById("back");
  const currentMonthDiv = document.getElementById("currentMonth");
  const currentDateDiv = document.getElementById("currentDate");
  const dayZero = firstDate();
  const numDays = numberOfDays();
  let currentDayIndex = numDays - 1;
  const currentDate = indexDate(dayZero, currentDayIndex);
  const currentDateString = currentDate.toISOString().slice(0, 10);
  currentMonthDiv.innerText = Months[currentDate.getMonth()];
  currentDateDiv.innerText = currentDate.getUTCDate();

  const width = 975;
  const height = 610;

  const path = d3.geoPath()
  const us = window.states;

  // const zoom = d3.zoom()
  //     .scaleExtent([1, 1])
  //     .on("zoom", zoomed);

  const svg = d3.select('#map')
      .append('svg')
      .attr("viewBox", [0, 0, width, height])
      .on("click", reset);

  const g = svg.append("g");


  const states = topojson.feature(us, us.objects.states).features;
  states.forEach((state, i) => {
    g.append("g")
      .attr("fill", "#444")
      .attr("stroke", "black")
      // .attr("cursor", "pointer")
    .selectAll("path")
    .data([state])
    .join("path")
      .attr("fill", color(state.properties.name, currentDateString))
      .on("click", clicked)
      .attr("d", path)
    .append("title")
      // .text(d => window.state_states[d.properties.name].growth_factor);
      .text(d => d.properties.name);
  });

  g.append("path")
      .attr("fill", "none")
      .attr("stroke", "none")
      .attr("stroke-linejoin", "round")
      .attr("d", path(topojson.mesh(us, us.objects.states, (a, b) => a !== b)));

  // svg.call(zoom);
  const cd = document.getElementById("cd");
  cd.style.display = 'flex';

  const dateSlider = renderDateSlider(dayZero, numDays - 1);
  let scrollWidth = dateSlider.scrollWidth;
  let dayWidth = scrollWidth / (numDays + 9)

  window.onresize = (e) => {
    scrollWidth = dateSlider.scrollWidth;
    dayWidth = scrollWidth / (numDays + 9);
    const scrollLeft = dayWidth *  (currentDayIndex)
    dateSlider.scrollLeft = scrollLeft;
  }

  dateSlider.onscroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const dayIndex = Math.round(scrollLeft / dayWidth);

    if (dayIndex === currentDayIndex) {
      return;
    }

    currentDayIndex = dayIndex;
    const date = indexDate(dayZero, dayIndex);
    const dateString = date.toISOString().slice(0, 10);

    currentMonthDiv.innerText = Months[date.getUTCMonth()];
    currentDateDiv.innerText = date.getUTCDate();

    d3.selectAll("g > g").remove()
    const states = topojson.feature(us, us.objects.states).features;

    states.forEach((state, i) => {
      g.append("g")
        .attr("fill", "#444")
        .attr("stroke", "black")
        .attr("cursor", "pointer")
      .selectAll("path")
      .data([state])
      .join("path")
        .attr("fill", color(state.properties.name, dateString))
        .on("click", clicked)
        .attr("d", path)
      .append("title")
        .text(d => window.state_states[d.properties.name].growth_factor);
    });
  }

  backButton.onclick = (e) => {
    backButton.style.display = 'none';
    reset();
  }

  function reset() {
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity,
      d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
    );
  }

  function clicked(d) {
    // backButton.style.display = 'block';
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    d3.event.stopPropagation();
    svg.transition().duration(750).call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
        .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
      d3.mouse(svg.node())
    );
  }

  function zoomed(e) {
    const {transform} = d3.event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }

  svg.node();
}
