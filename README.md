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
- 8GB of disk space (4GB for runtime and 4GB for base Stable Diffusion models)

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
3. Press the *Waiting to download* top-right button, select a directory where you want to store Stable Diffusion models and start downloading them (it will take a while to download about 2.4GB of base model and 1.5GB of upscaling model).
4. Create a new project, add a prompt to your project and start generating!

## Usage

### Projects & Prompts

> A project is a way to organise prompts. A prompt can contain any number of generated images with parameters that can be changed per each image gneeration.

https://user-images.githubusercontent.com/78038/221773977-3a6f7f5c-7072-49f2-8916-f30e87ec78d3.mp4

## Lock Seed To Variate

> Locking a seed and changing other parameters allows to generate similar image by content and different by styles using various parameters controlling the model (like strength, steps, and method). 

https://user-images.githubusercontent.com/78038/221774536-99b9b8bd-2b29-4538-9ae1-4aaf559a92f2.mp4

## Monitor Image Queue

> Imags queue shows number of images currently in the queue (waiting to be processed or generating right now). Tapping on each image in the queue focuses on the image.

<img src="https://user-images.githubusercontent.com/78038/221611689-9a566006-ff92-484a-aafb-bf6bf7a96e5d.png" width="530" />

## Manage Models Efficiently

> It is possible to install more than one text-to-image model from the hub and switch between them on a per image basis to iterate and compare results.

https://user-images.githubusercontent.com/78038/224510050-e8413781-22cc-4165-9903-ea1ca941a718.mov


## Next Steps

- [ ] ControlNet and image editing
- [ ] Infinite upscaling
- [ ] Fine-tuning support

## Contributors

- VERALOMNA
