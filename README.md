### Pen Matcher

[Pen Matcher Game](https://mehran-prs.github.io/pen-matcher/)

__Build the muscle memory to draw precise lines__

- Click on the New button
- Look at the reference lines on the ref canvas
- Draw them on the drawing canvas.
- Hit the Match button to reveal reference lines on your drawing canvas and see how much you were close.
- Repeat it.

### Local deploy:

```bash
serve -l 4000
```

### Features:
- crosshair, grid lines
- hint lines (draw 1/3th of your ref lines on the drawing canvas as hint)
- draw lines with curves

### How to draw precise lines:
Do draw precise lines, you need to draw line with proper **size** and **angle**.
Use `cooridnates + angle` to draw line and `relative-size` as double check solution
(or draw via `relative-size + angle` and double check via `coordinates`).


- __Coordinates__: based on what you see on the ref canvas(e.g., edges of the ref canvas or other lines), find out where
  you should starting the line and where end it.
- __Relative-size__: based on what you see on the ref canvas(e.g., edges sizes or other lines sizes), find out how long 
  should be your drawing line.
- __Angle__: make sure angle of you line is same as angle of your reference line.
- To draw a line, use coordinates and angle and to make sure line's size is correct, double check via relative-size
  (or draw via relative-size, angle solution and double check lin)

### Thanks to

- [Arrows icons created by Freepik - Flaticon](https://www.flaticon.com/free-icons/arrows)
