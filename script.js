const pokemonContainer = document.getElementById('pokemonDisplay');
const searchInput = document.getElementById('searchInput');
const leftArrow = document.getElementById('leftArrow');
const rightArrow = document.getElementById('rightArrow');
const filterContainer = document.getElementById('typeFilterContainer');

// Mapa de tipos a imágenes
const typeImages = {
    steel: "imgs/tipos_acero.png",
    normal: "imgs/tipos_normal.png",
    fighting: "imgs/tipos_lucha.png",
    flying: "imgs/tipos_volador.png",
    poison: "imgs/tipos_veneno.png",
    ground: "imgs/tipos_tierra.png",
    water: "imgs/tipos_agua.png",
    grass: "imgs/tipos_planta.png",
    fire: "imgs/tipos_fuego.png",
    electric: "imgs/tipos_electrico.png",
    psychic: "imgs/tipos_psiquico.png",
    ice: "imgs/tipos_hielo.png",
    bug: "imgs/tipos_bicho.png",
    rock: "imgs/tipos_roca.png",
    ghost: "imgs/tipos_fantasma.png",
    dragon: "imgs/tipos_dragon.png",
    dark: "imgs/tipos_siniestro.png",
    fairy: "imgs/tipos_hada.png"
};

// Crear el contenedor de sugerencias
const suggestionsContainer = document.createElement('div');
suggestionsContainer.classList.add('suggestions');
searchInput.parentNode.insertBefore(suggestionsContainer, searchInput.nextSibling);

let highlightedIndex = -1; // Para rastrear el índice resaltado
let currentPokemonIndex = -1; // Para rastrear el Pokémon actual
const pokemonCache = {}; // Cache para guardar los resultados
let allPokemons = []; // Variable para almacenar todos los pokémon

// Debounce para optimizar búsqueda
function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    leftArrow.style.display = 'none'; // Ocultar las flechas al inicio
    rightArrow.style.display = 'none'; // Ocultar las flechas al inicio

    document.getElementById('filterButton').addEventListener('click', () => {
        filterContainer.style.display = (filterContainer.style.display === 'none' || filterContainer.style.display === '') ? 'block' : 'none';
    });
    


    // Agregar botones de tipos al contenedor de filtro
    Object.keys(typeImages).forEach(type => {
        const typeButton = document.createElement('div');
        typeButton.classList.add('type-button');
        typeButton.innerHTML = `<img src="${typeImages[type]}" alt="${type}" class="type-image" data-type="${type}">`;
        
        typeButton.addEventListener('click', () => {
            filterByType(type); // Aplicar el filtro
            filterContainer.style.display = 'none'; // Ocultar el contenedor de tipos
        });

        filterContainer.appendChild(typeButton); // Añadir al contenedor de tipos
    });

    // Manejo del evento de entrada para buscar Pokémon con debounce
    searchInput.addEventListener('input', debounce(async function() {
        const query = searchInput.value.toLowerCase();
        suggestionsContainer.innerHTML = ''; // Limpiar sugerencias anteriores
        highlightedIndex = -1; // Reiniciar el índice resaltado

        if (query.length > 0) {
            suggestionsContainer.style.display = 'block'; // Mostrar sugerencias

            try {
                if (allPokemons.length === 0) {
                    const url = `https://pokeapi.co/api/v2/pokemon?limit=1025`;
                    const response = await fetch(url);
                    const data = await response.json();
                    allPokemons = data.results;
                }
                const filteredPokemons = allPokemons.filter(pokemon => pokemon.name.toLowerCase().startsWith(query));

                filteredPokemons.forEach((pokemon) => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('suggestion-item');
                    suggestionItem.textContent = capitalizeFirstLetter(pokemon.name);
                    suggestionItem.addEventListener('click', () => selectSuggestion(pokemon.name));
                    suggestionsContainer.appendChild(suggestionItem);
                });

                if (filteredPokemons.length === 0) {
                    const noResultsItem = document.createElement('div');
                    noResultsItem.classList.add('suggestion-item', 'no-results');
                    noResultsItem.textContent = 'No matches found';
                    suggestionsContainer.appendChild(noResultsItem);
                }
            } catch (error) {
                console.error('Error fetching Pokémon data:', error);
            }
        } else {
            suggestionsContainer.style.display = 'none'; // Ocultar si no hay entrada
        }
    }, 300)); // 300ms de debounce

    // Agregar evento para manejar la tecla Enter y las flechas
    searchInput.addEventListener('keydown', function(event) {
        const suggestions = suggestionsContainer.childNodes; // Obtiene las sugerencias
        if (event.key === 'Enter') {
            if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
                // Si hay una sugerencia resaltada, buscar ese Pokémon
                const highlightedPokemon = suggestions[highlightedIndex].textContent.toLowerCase(); // Convertir a minúsculas para la búsqueda
                selectSuggestion(highlightedPokemon); // Realiza la búsqueda del Pokémon resaltado
            } else {
                // Si no hay sugerencia resaltada, buscar lo que está escrito en el input
                searchPokemon();
            }
        } else if (event.key === 'ArrowDown') {
            if (highlightedIndex < suggestions.length - 1) {
                highlightedIndex++;
                updateHighlightedSuggestion();
            }
        } else if (event.key === 'ArrowUp') {
            if (highlightedIndex > 0) {
                highlightedIndex--;
                updateHighlightedSuggestion();
            }
        }
    });
    

    // Evento para las flechas de navegación
    leftArrow.addEventListener('click', () => navigatePokemon(-1));
    rightArrow.addEventListener('click', () => navigatePokemon(1));

    // Cerrar las sugerencias al hacer clic fuera
    document.addEventListener('click', function(event) {
        if (!suggestionsContainer.contains(event.target) && event.target !== searchInput) {
            suggestionsContainer.style.display = 'none'; // Ocultar sugerencias si se hace clic fuera
        }
    });
});

// Función para capitalizar la primera letra
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Función para buscar un Pokémon
async function fetchPokemonData(query) {
    if (pokemonCache[query]) {
        return pokemonCache[query]; // Retorna de la caché si ya lo tienes
    }
    const url = `https://pokeapi.co/api/v2/pokemon/${query}`;
    const response = await fetch(url);
    if (response.ok) {
        const data = await response.json();
        pokemonCache[query] = data; // Almacena en caché
        return data;
    } else {
        throw new Error('Pokémon no encontrado');
    }
}

async function searchPokemon() {
    const query = searchInput.value.toLowerCase();

    // Mostrar las flechas al buscar un Pokémon específico
    leftArrow.style.display = 'inline-block';
    rightArrow.style.display = 'inline-block';

    if (query) {
        try {
            const pokemonData = await fetchPokemonData(query);
            displayPokemon(pokemonData);
            currentPokemonIndex = pokemonData.id - 1;
        } catch (error) {
            console.error('Error fetching Pokémon:', error);
            displayErrorMessage('Pokémon no encontrado!');
        }
    }
}

// Ajustes en la función para filtrar Pokémon por tipo
async function filterByType(type) {
    leftArrow.style.display = 'none'; // Ocultar flechas al aplicar un filtro
    rightArrow.style.display = 'none';

    try {
        if (allPokemons.length === 0) {
            const url = `https://pokeapi.co/api/v2/pokemon?limit=1025`;
            const response = await fetch(url);
            const data = await response.json();
            allPokemons = data.results;
        }

        const url = `https://pokeapi.co/api/v2/type/${type}`;
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const typePokemonList = data.pokemon.map(p => p.pokemon);
            const filteredPokemonList = allPokemons.filter(pokemon =>
                typePokemonList.some(typePokemon => typePokemon.name === pokemon.name)
            );

            // Comprobar si hay Pokémon filtrados antes de mostrarlos
            if (filteredPokemonList.length > 0) {
                displayFilteredPokemons(filteredPokemonList);
            } else {
                displayErrorMessage('No se pudo encontrar ningún Pokémon de este tipo.');
            }
        } else {
            console.error('Error al buscar Pokémon por tipo:', response.status);
        }
    } catch (error) {
        console.error('Error al buscar la data del Pokémon:', error);
        displayErrorMessage('Error al buscar la data del Pokémon.');
    }
}

async function fetchWeaknesses(types) {
    const weaknesses = {};

    // Para cada tipo del Pokémon, obtener las debilidades desde la API
    for (let i = 0; i < types.length; i++) {
        const typeName = types[i].type.name;
        const url = `https://pokeapi.co/api/v2/type/${typeName}`;
        const response = await fetch(url);
        const data = await response.json();

        // Obtener los tipos que causan más daño (doble daño)
        data.damage_relations.double_damage_from.forEach(weakType => {
            weaknesses[weakType.name] = true; // Agregar el tipo que es débil
        });
    }

    return Object.keys(weaknesses); // Devolver los nombres de los tipos que son debilidades
}

// Función para mostrar un Pokémon específico
function displayPokemon(pokemon) {
    const typesContainer = document.createElement('div');
    typesContainer.classList.add('types');

    pokemon.types.forEach(typeInfo => {
        const typeImage = document.createElement('img');
        typeImage.src = typeImages[typeInfo.type.name];
        typeImage.alt = typeInfo.type.name;
        typeImage.classList.add('type-image');

        typesContainer.appendChild(typeImage);
    });

    pokemonContainer.innerHTML = `
        <div class="pokemon">
            <h2>#${pokemon.id}</h2>
            <img src="${pokemon.sprites.other['official-artwork'].front_default}" alt="${pokemon.name}">
            <h1>${capitalizeFirstLetter(pokemon.name)}</h1>
        </div>
    `;

    const pokemonElement = pokemonContainer.querySelector('.pokemon');
    pokemonElement.appendChild(typesContainer);
}

// Función para mostrar Pokémon filtrados
async function displayFilteredPokemons(pokemonList) {
    pokemonContainer.innerHTML = ''; // Limpiar contenedor antes de agregar nuevos Pokémon
    
    // Obtener los datos completos de cada Pokémon
    const promises = pokemonList.map(pokemon => {
        return fetch(pokemon.url)
            .then(response => response.json())
            .then(pokemonData => {
                return pokemonData; // Devolver los datos del Pokémon
            });
    });

    // Esperamos a que todas las promesas se resuelvan
    const pokemonDataList = await Promise.all(promises);

    // Ordenamos los Pokémon por su ID antes de mostrarlos
    const sortedPokemonList = pokemonDataList.sort((a, b) => a.id - b.id);

    // Creamos los elementos de los Pokémon
    sortedPokemonList.forEach(pokemonData => {
        const pokemonElement = document.createElement('div');
        pokemonElement.classList.add('pokemon');

        // Crear un contenedor para los tipos
        const typesContainer = document.createElement('div');
        typesContainer.classList.add('types');

        // Agregar imágenes de los tipos
        pokemonData.types.forEach((typeInfo) => {
            const typeImage = document.createElement('img');
            typeImage.src = typeImages[typeInfo.type.name]; // Asegúrate de que typeImages tiene todos los tipos
            typeImage.alt = typeInfo.type.name;
            typeImage.classList.add('type-image');

            // Añadir el tipo al contenedor
            typesContainer.appendChild(typeImage);
        });

        pokemonElement.innerHTML = `
            <h2>#${pokemonData.id}</h2>
            <img src="${pokemonData.sprites.other['official-artwork'].front_default}" alt="${pokemonData.name}">
            <h1>${capitalizeFirstLetter(pokemonData.name)}</h1>
        `;

        // Agregar el contenedor de tipos al Pokémon
        pokemonElement.appendChild(typesContainer);

        // Agregar el elemento al contenedor principal
        pokemonContainer.appendChild(pokemonElement);
    });
}


// Función para navegar entre Pokémon
// Función para manejar la navegación entre Pokémon
// Manejo de navegación con deshabilitación de flechas
function navigatePokemon(direction) {
    if (currentPokemonIndex !== -1) {
        let newIndex = currentPokemonIndex + direction;

        // Establecer límites
        if (newIndex < 0) {
            newIndex = 1024; // Ir a Pecharunt
        } else if (newIndex > 1024) {
            newIndex = 0; // Ir a Bulbasaur
        }
        // Deshabilitar flechas si estamos en los extremos
        leftArrow.style.display = newIndex === 0 ? 'none' : 'inline-block';
        rightArrow.style.display = newIndex === 1024 ? 'none' : 'inline-block';

        // Cargar Pokémon correspondiente al nuevo índice
        fetch(`https://pokeapi.co/api/v2/pokemon/${newIndex + 1}`)
            .then(response => {
                if (response.ok) {
                    return response.json();
                } else {
                    throw new Error('Pokémon no encontrado');
                }
            })
            .then(pokemonData => {
                displayPokemon(pokemonData);
                currentPokemonIndex = newIndex; // Actualizar el índice actual
            })
            .catch(error => {
                console.error(error);
                displayErrorMessage('No se pudo navegar a este Pokémon. Por favor, inténtelo de nuevo.');
            });
    }
}

// Función para actualizar la sugerencia resaltada
function updateHighlightedSuggestion() {
    const suggestionItems = suggestionsContainer.getElementsByClassName('suggestion-item');
    for (let i = 0; i < suggestionItems.length; i++) {
        suggestionItems[i].classList.remove('highlighted');
    }
    if (highlightedIndex >= 0) {
        suggestionItems[highlightedIndex].classList.add('highlighted');
        suggestionItems[highlightedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

// Función para seleccionar una sugerencia
async function selectSuggestion(suggestion) {
    searchInput.value = suggestion;
    suggestionsContainer.style.display = 'none';
    await searchPokemon();
}

// Función para mostrar un mensaje de error
function displayErrorMessage(message) {
    pokemonContainer.innerHTML = `<p class="error-message">${message}</p>`;
}

// Asegúrate de que este código esté después de que hayas definido los elementos del DOM

// Obtener el botón de búsqueda
const searchButton = document.getElementById('searchButton');

// Agregar evento de clic al botón de búsqueda
searchButton.addEventListener('click', () => {
    const suggestions = suggestionsContainer.childNodes; // Obtener las sugerencias
    if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        // Si hay una sugerencia resaltada, buscar ese Pokémon
        const highlightedPokemon = suggestions[highlightedIndex].textContent.toLowerCase();
        searchInput.value = highlightedPokemon; // Autocompletar el campo de búsqueda con el nombre resaltado
        selectSuggestion(highlightedPokemon); // Buscar el Pokémon resaltado
    } else {
        // Si no hay sugerencia resaltada, buscar lo que está en el input
        searchPokemon();
    }
});