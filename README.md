# Varnava

Varnava is a neural art management tool powered by Stable Diffusion. Varnava is heavily used by VERALOMNA artists to generate concept arts and textures for the games in the works. 

> The purpose of Varnava is to provide self-contained self-contained environment which can be easy to install and update. 

<br />
<img src="https://user-images.githubusercontent.com/78038/221606253-c3ff360d-48ef-4a7e-951c-abe748daf170.png" width="530" />

## Main Features

- **Self-Contained** application manages the necessary runtime environment for Stable Diffusion: no need to install various dependencies and models manually. 
- **Easy to use** and intuitive user interface to manage prompts and associated images.
- **Projects** allow grouping prompts by their meaning.
- **Queued generation**: schedule any number of images to be generated for any number of prompts and Varnava will update the images as soon as they are ready.
- **Dynamic generation settings** per output for maximum flexibility.
- **Upscale** images that you like the most and export them.
- **Variate** images by locking image seeds via user interface.

## Requirements 

- Windows 10+
  - GPU with CUDA support and at least 8GB of VRAM
- macOS 12.0+
  - M1/M2 SoC with at least 15GB of RAM
- 21GB of disk space (4GB for runtime and 17GB for Stable Diffusion models)

The following setups have been tested so far:

- Windows 11
  - NVIDIA RTX 4080
  - NVIDIA RTX 4090
  - NVIDIA RTX 3090 TI
  - NVIDIA RTX 3090
- macOS 13.0
  - M1 Pro
  - M1 Max

## Installation

1. Download the installer from the releases page on Github and run the installer.
2. Varnava will download necessary dependencies on the first launch (it will take a while, please have patience).
3. Go to *Models* dialog, select a directory where you want to store Stable Diffusion models and start downloading them (it will take a while to download about 17GB of models).
4. Create a new project, add a prompt to your project and start generating!

## Usage

### Projects & Prompts

> A project is a way to organise prompts. A prompt can contain any number of generated images with parameters that can be changed per each image gneeration.

https://user-images.githubusercontent.com/78038/221611222-2a77425a-6538-4312-8306-05338b519e1a.mov

## Lock Seed To Variate

> Locking a seed and changing other parameters allows to generate similar image by content and different by styles using various parameters controlling the model (like strength, steps, and method). 

https://user-images.githubusercontent.com/78038/221612812-5d7f9b33-e2bb-4870-bb04-fba5e206b46f.mp4

## Monitor Image Queue

> Imags queue shows number of images currently in the queue (waiting to be processed or generating right now). Tapping on each image in the queue focuses on the image.

<img src="https://user-images.githubusercontent.com/78038/221611689-9a566006-ff92-484a-aafb-bf6bf7a96e5d.png" width="530" />

## Next Steps

- [ ] Infinite upscaling via tiled upscaling
- [ ] Painting canvas
- [ ] Fine-tuning support
- [ ] Image to image support

## Contributors

- VERALOMNA
