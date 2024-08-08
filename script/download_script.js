// DOM element references
const releasesList = document.getElementById('releases-list');
const pagination = document.getElementById('pagination');
const loading = document.getElementById('loading');
const sortButtons = document.querySelectorAll('.sort-btn');
const minecraftFilterContent = document.getElementById('minecraftFilter');

// Variables for release data and filters
let allReleases = [];
let filteredReleases = [];
let currentPage = 1;
const releasesPerPage = 5;
let currentSort = 'date';
let currentMinecraftFilter = '';
let currentLoaderFilter = '';

// Fetches releases from GitHub and updates the UI
async function fetchReleases() {
  try {
    loading.style.display = 'flex';
    releasesList.style.display = 'none';
    pagination.style.display = 'none';

    const response = await fetch('https://api.github.com/repos/IzzelAliz/Arclight/releases');
    allReleases = await response.json();
    filteredReleases = [...allReleases];
    sortReleases();
    displayReleases();
    setupPagination();
    populateMinecraftVersions();

    loading.style.display = 'none';
    releasesList.style.display = 'flex';
    pagination.style.display = 'flex';
  } catch (error) {
    console.error('Error fetching releases:', error);
    loading.style.display = 'none';
    releasesList.innerHTML = '<p><i class="fas fa-exclamation-triangle emoji"></i> Error loading releases. Please try again later.</p>';
  }
}

// Extracts Minecraft version and loaders from assets
function getMinecraftVersionAndLoaders(assets) {
  let minecraftVersion = 'Unknown';
  let loaders = new Set();

  for (const asset of assets) {
    const match = asset.name.match(/arclight-(fabric|forge|neoforge)-(\d+\.\d+(?:\.\d+)?)/);
    if (match) {
      const loader = match[1];
      const version = match[2];
      minecraftVersion = version;
      loaders.add(loader);
    }
  }

  return { minecraftVersion, loaders: Array.from(loaders) };
}

// Returns the appropriate loader icon based on loader type
function getLoaderIcon(loader) {
  switch (loader.toLowerCase()) {
    case 'fabric':
      return '<img src="https://fabricmc.net/assets/logo.png" alt="Fabric" class="loader-icon">';
    case 'forge':
      return '<img src="https://files.minecraftforge.net/static/images/favicon.ico" alt="Forge" class="loader-icon">';
    case 'neoforge':
      return '<img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse2.mm.bing.net%2Fth%3Fid%3DOIP.JFaEN4Xg_9MAT61s4wsuVgAAAA%26pid%3DApi&f=1&ipt=9d6fe210ff7bf5d5d3b51536e8ae02739acfc6ff9c3ddf44b2c1e0df281d6b4a&ipo=images" alt="NeoForge" class="loader-icon">';
    default:
      return '<i class="fas fa-question-circle loader-icon"></i>';
  }
}

// Sorts releases based on the current sort criteria
function sortReleases() {
  switch (currentSort) {
    case 'date':
      filteredReleases.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
      break;
    case 'version':
      filteredReleases.sort((a, b) => b.tag_name.localeCompare(a.tag_name, undefined, { numeric: true, sensitivity: 'base' }));
      break;
    case 'minecraft':
      filteredReleases.sort((a, b) => {
        const versionA = getMinecraftVersionAndLoaders(a.assets).minecraftVersion;
        const versionB = getMinecraftVersionAndLoaders(b.assets).minecraftVersion;
        return versionB.localeCompare(versionA, undefined, { numeric: true, sensitivity: 'base' });
      });
      break;
  }
}

// Displays releases on the page
function displayReleases() {
  const startIndex = (currentPage - 1) * releasesPerPage;
  const endIndex = startIndex + releasesPerPage;
  const releasesToShow = filteredReleases.slice(startIndex, endIndex);

  releasesList.innerHTML = '';

  releasesToShow.forEach((release, index) => {
    const releaseCard = document.createElement('div');
    releaseCard.className = 'release-card';
    releaseCard.style.animationDelay = `${index * 0.1}s`;
    const { minecraftVersion, loaders } = getMinecraftVersionAndLoaders(release.assets);
    const loaderIcons = loaders.map(loader => getLoaderIcon(loader)).join(' ');
    releaseCard.innerHTML = `
      <div class="release-info">
        <h3 class="release-version"><i class="fas fa-tag emoji"></i> ${release.tag_name}</h3>
        <span class="minecraft-version"><i class="fas fa-cubes emoji"></i> Minecraft ${minecraftVersion}</span>
        <span class="loaders">${loaderIcons} ${loaders.join(', ')}</span>
      </div>
      <a href="${release.html_url}" class="release-btn" target="_blank">
        <i class="fas fa-external-link-alt"></i> View Release
      </a>
    `;
    releasesList.appendChild(releaseCard);
  });
}

// Sets up pagination controls
function setupPagination() {
  const totalPages = Math.ceil(filteredReleases.length / releasesPerPage);
  pagination.innerHTML = '';

  // Previous button
  const prevButton = document.createElement('button');
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
  prevButton.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      displayReleases();
      updatePaginationButtons();
    }
  });
  pagination.appendChild(prevButton);

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement('button');
    pageButton.textContent = i;
    pageButton.addEventListener('click', () => {
      currentPage = i;
      displayReleases();
      updatePaginationButtons();
    });
    pagination.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement('button');
  nextButton.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
  nextButton.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      displayReleases();
      updatePaginationButtons();
    }
  });
  pagination.appendChild(nextButton);

  updatePaginationButtons();
}

// Updates the state of pagination buttons
function updatePaginationButtons() {
  const totalPages = Math.ceil(filteredReleases.length / releasesPerPage);
  const buttons = pagination.getElementsByTagName('button');

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    if (button.textContent.includes('Previous')) {
      button.disabled = currentPage === 1;
    } else if (button.textContent.includes('Next')) {
      button.disabled = currentPage === totalPages;
    } else {
      const pageNum = parseInt(button.textContent);
      button.disabled = pageNum === currentPage;
      button.style.fontWeight = pageNum === currentPage ? 'bold' : 'normal';
    }
  }
}

// Adds click event listeners to sort buttons
sortButtons.forEach(button => {
  button.addEventListener('click', () => {
    sortButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    currentSort = button.dataset.sort;
    currentPage = 1;
    sortReleases();
    displayReleases();
    updatePaginationButtons();
  });
});

// Toggles the visibility of dropdowns
function toggleDropdown(id) {
  document.getElementById(id).classList.toggle("show");
}

// Closes dropdowns when clicking outside
window.onclick = function(event) {
  if (!event.target.matches('.filter-btn')) {
    var dropdowns = document.getElementsByClassName("filter-content");
    for (var i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}

// Populates Minecraft version filter options
function populateMinecraftVersions() {
  const versions = new Set();
  allReleases.forEach(release => {
    const { minecraftVersion } = getMinecraftVersionAndLoaders(release.assets);
    versions.add(minecraftVersion);
  });

  minecraftFilterContent.innerHTML = '';
  Array.from(versions).sort((a, b) => b.localeCompare(a, undefined, { numeric: true, sensitivity: 'base' })).forEach(version => {
    const button = document.createElement('button');
    button.textContent = version;
    button.onclick = () => filterMinecraftVersion(version);
    minecraftFilterContent.appendChild(button);
  });
}

// Filters releases by Minecraft version
function filterMinecraftVersion(version) {
  currentMinecraftFilter = version;
  applyFilters();
}

// Filters releases by loader type
function filterLoader(loader) {
  currentLoaderFilter = loader;
  applyFilters();
}

// Applies all filters and updates display
function applyFilters() {
  filteredReleases = allReleases.filter(release => {
    const { minecraftVersion, loaders } = getMinecraftVersionAndLoaders(release.assets);
    const matchesMinecraft = !currentMinecraftFilter || minecraftVersion === currentMinecraftFilter;
    const matchesLoader = !currentLoaderFilter || loaders.includes(currentLoaderFilter);
    return matchesMinecraft && matchesLoader;
  });

  currentPage = 1;
  sortReleases();
  displayReleases();
  setupPagination();
}

// Resets all filters and reloads releases
function resetFilters() {
  currentMinecraftFilter = '';
  currentLoaderFilter = '';
  filteredReleases = [...allReleases];
  currentPage = 1;
  sortReleases();
  displayReleases();
  setupPagination();
}

// Initial fetch of releases
fetchReleases();
