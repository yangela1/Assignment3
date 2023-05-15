const PAGE_SIZE = 10;
let sorted = [];
let currentPage = 1;
let pokemons = [];


const updatePaginationDiv = (currentPage, numPages) => {
  $("#pagination").empty();
  
  const numBtns = 5; 
  const btns = []; 
  
  let startButton = currentPage - Math.floor(numBtns / 2);
  let endButton = startButton + numBtns - 1;
  
  if (startButton < 1) {
    startButton = 1;
    endButton = Math.min(numPages, startButton + numBtns - 1);
  }
  
  if (endButton > numPages) {
    endButton = numPages;
    startButton = Math.max(1, endButton - numBtns + 1);
  }
  
  for (let i = startButton; i <= endButton; i++) {
    btns.push(i);
  }
   
  
 // Add the buttons to the pagination div
 if (currentPage > 1) {
  $("#pagination").append(
    `
    <button class="btn btn-primary page ml-1 numberedButtons" id="pageFirst" value ="1">First</button>
    `
  );


  $("#pagination").append(
    `
    <button class="btn btn-primary ml-1 numberedButtons page" id="pagePrev" value="${currentPage-1}">Prev</button>
  `
  );
}

btns.forEach((i) => {
  $("#pagination").append(`
  <button class="btn btn-primary page ml-1 numberedButtons ${i === currentPage ? 'active': ''}" value="${i}">${i}</button>
  `);
});

if (currentPage < numPages) {
  $("#pagination").append(
    ` <button class="btn btn-primary page ml-1 numberedButtons" id="pageNext" value="${currentPage+1}">Next</button>`
  );
  $("#pagination").append(
    `<button class="btn btn-primary page ml-1 numberedButtons" id="pageLast" value="${numPages}">Last</button>`
  );
}

};
 
 
const paginate = (currentPage, PAGE_SIZE, pokemons) => {
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = currentPage * PAGE_SIZE;
  const selected_pokemons = pokemons.slice(start, end);

  const pokemonDetails = [];
  selected_pokemons.forEach((pokemon) => {
    const response = axios.get(pokemon.url);
    pokemonDetails.push(response);
  });

  return axios.all(pokemonDetails)
    .then((responses) => {
      const sorted_pokemons = responses.sort((a, b) => a.data.id - b.data.id);

      $("#pokeCards").empty();
      sorted_pokemons.forEach((pokemon) => {
        const { name, sprites } = pokemon.data;
        $("#pokeCards").append(`
          <div class="pokeCard card" pokeName=${name}>
            <h3>${name.toUpperCase()}</h3> 
            <img src="${sprites.front_default}" alt="${name}"/>
            <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#pokeModal">
              More
            </button>
          </div>   
        `);
      });
    });
};
     
const filtersDiv = async () => {
    const response = await axios.get("https://pokeapi.co/api/v2/type");
    const pokemons = response.data.results;
    const sorted = pokemons.map((type, i) =>
          `<div class="sorted">
            <input type="checkbox" id="${i}" name="${type.name}" value="${type.name}" class="checkbox">
            <label for="${type.name}" class="label">${type.name}</label>
          </div>`
      ).join("");
    $("#addFilter").html(sorted);

};
 
const message = (k, displayPokemons) => {
  $("#messages").empty();
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(currentPage * PAGE_SIZE, displayPokemons);
  const currentPagePokemonCount = endIndex - startIndex;
  $("#messages").append(
    `<h1>Showing ${currentPagePokemonCount} of ${displayPokemons} Pokemons</h1>`
  );
};
 

const filter = async ({ pokemonType }) => {
  let response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?offset=0&limit=810"
  );
  pokemons = response.data.results;
  const filteredPokemons = [];

  for (let i = 0; i < pokemons.length; i++) {
    const pokemon = pokemons[i];
    let res = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${pokemon.name}`
    );

    //matching function
    let match = false;
    let  pokemonTypeArray = res.data.types.map((type) => type.type.name);
    if ( pokemonType.every((typeName) =>  pokemonTypeArray.includes(typeName))) {
      match = true;
    }
    if (match) {
      filteredPokemons.push(pokemon);
    }
  }
  sorted = filteredPokemons;

  paginate(1, PAGE_SIZE, filteredPokemons);
  const numPages = Math.ceil(filteredPokemons.length / PAGE_SIZE);
  updatePaginationDiv(1, numPages);
  message(currentPage, filteredPokemons.length);
};

const setup = async () => {
  // test out poke api using axios here
  $("#pokeCards").empty();
  let response = await axios.get(
    "https://pokeapi.co/api/v2/pokemon?offset=0&limit=810"
  );
  pokemons = response.data.results;

  paginate(currentPage, PAGE_SIZE, pokemons);
  const numPages = Math.ceil(pokemons.length / PAGE_SIZE);
  updatePaginationDiv(currentPage, numPages);
  filtersDiv();
  message(currentPage, pokemons.length);
 
  let pokemonType = [];

  $("body").on("change", ".checkbox", function (e) {
    pokemonType  = [];
    $(".checkbox:checked").each(function () {
      pokemonType .push($(this).val());
    });
    filter({ pokemonType });
  });
 
   
  $("body").on("click", ".pokeCard", async function (e) {
    const pokemonName = $(this).attr("pokeName");
    const res = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${pokemonName}`
    );
    const pokemonTypes = res.data.types.map((type) => type.type.name);
    $(".modal-body").html(`
        <div style="width:200px">
        <img src="${
          res.data.sprites.other["official-artwork"].front_default
        }" alt="${res.data.name}"/>
        <div>
        <h3>Abilities</h3>
        <ul>
        ${res.data.abilities
          .map((ability) => `<li>${ability.ability.name}</li>`)
          .join("")}
        </ul>
        </div>

        <div>
        <h3>Stats</h3>
        <ul>
        ${res.data.stats
          .map((stat) => `<li>${stat.stat.name}: ${stat.base_stat}</li>`)
          .join("")}
        </ul>

        </div>

        </div>
          <h3>Types</h3>
          <ul>
          ${pokemonTypes.map((type) => `<li>${type}</li>`).join("")}
          </ul>
      
        `);
    $(".modal-title").html(`
        <h2>${res.data.name.toUpperCase()}</h2>
        <h5>${res.data.id}</h5>
        `);
  });

  $(document).on("click", ".firstButton", () => {
    currentPage = 1;
    paginate(currentPage, PAGE_SIZE, sorted.length ? sorted : pokemons);
    updatePaginationDiv(currentPage,Math.ceil(sorted.length ? sorted.length / PAGE_SIZE: pokemons.length / PAGE_SIZE));
  });

  $(document).on("click", ".prevButton", () => {
    currentPage--;
    paginate(currentPage, PAGE_SIZE,sorted.length ? sorted : pokemons);
    updatePaginationDiv(currentPage,Math.ceil(sorted.length ? sorted.length / PAGE_SIZE: pokemons.length / PAGE_SIZE));
  });

  $(document).on("click", ".nextButton", () => {
    currentPage++;
    paginate(currentPage,PAGE_SIZE,sorted.length ? sorted : pokemons
    );
    updatePaginationDiv(currentPage,Math.ceil( sorted.length ? sorted.length / PAGE_SIZE : pokemons.length / PAGE_SIZE));
  });

  $(document).on("click", ".lastButton", () => {
    console.log(sorted);
    currentPage = Math.ceil(sorted.length ? sorted.length / PAGE_SIZE : pokemons.length / PAGE_SIZE);
    paginate(currentPage,PAGE_SIZE,sorted.length ? sorted : pokemons);
    updatePaginationDiv(currentPage,Math.ceil( sorted.length ? sorted.length / PAGE_SIZE: pokemons.length / PAGE_SIZE ));
  });
     
  $(document).on("click", ".numberedButtons", (e) => {
    currentPage = parseInt(e.target.value);
    paginate(currentPage,PAGE_SIZE,sorted.length ? sorted: pokemons);
    updatePaginationDiv(currentPage, Math.ceil(sorted.length ? sorted.length / PAGE_SIZE: pokemons.length / PAGE_SIZE ));
  });
};

$(document).ready(setup);   