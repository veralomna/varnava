# Varnava

Varnava is a neural art management tool powered by Stable Diffusion. Varnava is heavily used by VERALOMNA artists to generate concept arts and textures for the games in the works. 

> The purpose of Varnava is to provide self-contained self-contained environment which can be easy to install and update. 

<br />
<img src="https://user-images.githubusercontent.com/78038/220036882-fef3246f-d839-462b-b095-0379c12638e7.png" width="500" />

## Main Features

- **Self-Contained** application manages the necessary runtime environment for Stable Diffusion: no need to install various dependencies and models manually. 
- **Easy to use** and intuitive user interface to manage prompts and associated images.
- **Projects** allow grouping prompts by their meaning.
- **Queued generation**: schedule any number of images to be generated for any number of prompts and Varnava will update the images as soon as they are ready.
- **Dynamic generation settings** per output for maximum flexibility.
- **Upscale** images that you like the most and export them.
- Generate **variations** of your images.

## Requirements 

- Windows 10+
- GPU with CUDA support and at least 8GB of VRAM
- 30GB of disk space (8GB for runtime and 22GB for Stable Diffusion models)

The following GPUs have been tested so far:

- NVIDIA RTX 4080
- NVIDIA RTX 4090
- NVIDIA RTX 3090 TI
- NVIDIA RTX 3090

## Installation

1. Download the installer from the releases page on Github and run the installer.
2. Varnava will download necessary dependencies on the first launch (it will take a while, please have patience).
3. Go to *Models* dialog, select a directory where you want to store Stable Diffusion models and start downloading them (it will take a while to download about 20GB of models).
4. Create a new project, add a prompt to your project and start generating!

## Usage

You can change generation options before you start generation next image (or next two images): 

https://user-images.githubusercontent.com/78038/220040145-4978aca9-9685-4fd7-bc7f-e899aa088e4a.mp4

<br />
<br />

> This section is a work in progress.

## Next Steps

- [ ] Automatic xFormers installation
- [ ] Infinite upscaling via tiled upscaling
- [ ] Better and more useful variations
- [ ] Painting canvas
- [ ] Training support
- [ ] macOS support

## Contributors

- VERALOMNA
