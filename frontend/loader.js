class FullScreenLoader {
    constructor() {
        this.loaderContainer = document.createElement('div');
        this.loaderContainer.id = 'loader-container';
        this.loaderContainer.style.display = 'flex';
        this.loaderContainer.style.alignItems = 'center';
        this.loaderContainer.style.flexDirection = 'column';
        this.loaderContainer.style.justifyContent = 'center';
        this.loaderContainer.style.position = 'fixed';
        this.loaderContainer.style.top = '0';
        this.loaderContainer.style.left = '0';
        this.loaderContainer.style.width = '100%';
        this.loaderContainer.style.height = '100%';
        this.loaderContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Black color with 50% opacity
        this.loaderContainer.style.zIndex = '999';
        this.loaderContainer.style.visibility = 'hidden';
        this.loaderContainer.style.opacity = '0';
        this.loaderContainer.style.transition = 'visibility 0s, opacity 0.5s ease';

        this.loader = document.createElement('div');
        this.loader.classList.add('loader');
        this.loaderContainer.appendChild(this.loader);

        // Text element
        this.loaderText = document.createElement('div');
        this.loaderText.style.color = '#ffffff'; // White text color
        this.loaderText.style.marginTop = '10px'; // Adjust the margin as needed
        this.loaderText.textContent = 'Please wait...';

        this.loaderContainer.appendChild(this.loader);
        this.loaderContainer.appendChild(this.loaderText);
        document.body.appendChild(this.loaderContainer);
    }

    showLoader() {
        this.loaderContainer.style.visibility = 'visible';
        this.loaderContainer.style.opacity = '1';
    }

    hideLoader() {
        this.loaderContainer.style.visibility = 'hidden';
        this.loaderContainer.style.opacity = '0';
    }
}
