const gradient = (vector1, vector2, scalar) => {
  return vector1.map((v1, i) => {
    v2 = vector2[i]
    return v1 - ( v1 -  v2) * scalar
  });
}

const color = (stateName, date, isLatest) => {
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

  const { growth_factor } = state_date;
  if (growth_factor < 0.5) {
    return `rgba(${receding.join(',')},1)`;
  } else if (growth_factor < 1) {
    const scalar = (growth_factor - 0.5) / 0.5;
    const rgb = gradient(receding, flattening, scalar);
    return `rgba(${rgb.join(',')},1)`;
  } else if (growth_factor < 1.5) {
    const scalar = (growth_factor - 1.0) / 0.5;
    const rgb = gradient(growing, peak, scalar);
    return `rgba(${rgb.join(',')},1)`;
  } else {
    return `rgba(${peak.join(',')},1)`;
  }
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
  const date = new Date(dateZero);
  date.setDate(date.getDate() + Number(index));
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate()
  return date.toISOString().slice(0, 10);
}

window.main = () => {
  const slider = document.getElementById("slider");
  const dateDiv = document.getElementById("date");
  const backButton = document.getElementById("back");
  const dayZero = firstDate();
  const numDays = numberOfDays();
  slider.max = numDays
  slider.value = numDays;
  const displayDate = indexDate(dayZero, numDays);
  dateDiv.innerText = displayDate;

  window.addEventListener('scroll', (e) => {
    console.log(e);
  })

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
      .attr("fill", color(state.properties.name, displayDate, true))
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

  slider.oninput = (e) => {
    const day = e.target.value;
    const date = indexDate(dayZero, day);
    dateDiv.innerText = date;
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
        .attr("fill", color(state.properties.name, date, date === displayDate))
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
