# Living Room

## Overview

A WebGL implementation of a small living room. In which you can change perspective, move chairs, open draws, turn on lamps etc. Both texture mapping and normal mapping have been used at several points to give a sense of depth.

## Running the program

Navigate to Computer_Graphics and run

```bash
python3 -m http.server
```

This will start running a server on a given port, this port number will be outputted in the terminal(most likely port 8000).

For me the program executes considerably better in firefox instead of chrome, so navigate to 
```bash
http://localhost:8000/code/living_room.html
```
in firefox.


You will then be able to interact with the system using both the buttons found along the bottom of the window(to trigger animations, change view and turn on/off lighting) and through using the arrow keys on your keyboard(to rotate and change the angle of the room)
## Resources used 
Only the libraries provided in your practicals have been used. Almost all textures and normal maps have been taken from 'https://3dtextures.me'.

## System Features

- Can open and close any of the draws in the chest
- Can open and close the cabinet below the tv
- Can push and pull the chairs in and out
- Clock ticks continually while program is running
- 3 overlapping spot lamps that hang over the table can be turned on and off
- Texture mapping has been applied to all objects apart from the table and chairs, wall and lamps
- Normal mapping has been applied to the floor, carpet and coffee table

## Example

![Screenshot from 2022-09-05 18-15-40](https://user-images.githubusercontent.com/30124151/188495690-f5043ab1-74c6-4298-8b9f-313de8f6b052.png)

![Screenshot from 2022-09-05 18-16-00](https://user-images.githubusercontent.com/30124151/188495728-9ee88036-0646-4c03-86d0-3546b394fc41.png)

![Screenshot from 2022-09-05 18-15-52](https://user-images.githubusercontent.com/30124151/188495718-eee7e6a2-e27d-4d87-8530-e7098ef34fb9.png)

![Screenshot from 2022-09-05 18-16-31](https://user-images.githubusercontent.com/30124151/188495815-647a70e1-2197-4c2e-932c-2f0c2ddeeaf9.png)


