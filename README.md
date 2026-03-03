March Madness Filtering Frenzy
===
*Created By: Anthony Coutts, Peter Czepiel, Timothy Hutzley, Yanhong Liu*

# Process Book


## Project Background:

### Overview:
- Our project is an interactive visualization that allows the user to apply several filters to a dataset of every College Basketball team that made it to the March Madness Tournament between the years 2013-2023. Our site is broken up into two halves, with the top half containing our five different filtering options, and the bottom half housing the collection of teams that apply to the current filters. All five filters work together to show only relevant teams.

### Motivation:
- We were motivated to create a project in this topic due to personal interest. Members of our team are avid basketball enjoyers that wanted an effective and aesthetically pleasing way to see different statistics about the best College Basketball teams of the past years. We also hoped that our site would make the March Madness Tournament easier to understand for users that want to become fans of College Basketball but may not currently have the best understanding.

## Related Work:
- We were heavy inspired by the interactive visualization called Selfiexplanatory (part of SelfieCity) that we looked at during class. This site stood out to our team due to its immense scale and variety of sampling techniques. We really liked how they chose to display their filtering options in a non-traditional way (for example: showing distribution graphs for the user to click on) and we chose to implement similar non-traditional filtering components wherever possible. 
- Here is the link to the original site: [SelfieCity](https://selfiecity.net/selfiexploratory/?dataset=%5Blondon%5D)

## Questions:
- 

What questions are you trying to answer? How did these questions evolve over the course of the project? What new questions did you consider in the course of your analysis?


## Data:
### Source:
- We gathered out data from a database created by Bart Torvik. Starting back in 2008, Bart Torvik began collecting and analyzing data on College Basketball to allow himself to make better March Madness Brackets, with the hope of being the first person to create the perfect bracket (all chosen teams win their matchups). Torvik took data from free online databases like [Sports Reference](https://www.sports-reference.com/cbb/) and performed advanced statistics techniques that he created (like T-Rank and Project Effective Talent). Eventually Bart Torvik made his data analysis public and free by creating the website where we got our data: [barttorvik.com](https://barttorvik.com/#)

### Cleaning and Usage:
- The website where we got our data from ([barttorvik.com](https://barttorvik.com/#)) featured an abundance of categories. Our group chose 14 categories that we wanted to implement into our site. Below is the full list of these categories as they appear in the initial dataset:
    - TEAM
    - CONF
    - W%
    - ORB (Offensive Rebounds)
    - DRB (Defensive Rebounds)
    - FTR (Free Throw Percentage Made)
    - FTRD (Free Throw Percentage Made by Opponent)
    - 2P_O (Offensive 2 point shots made)
    - 2P_D (2 point shots made by opponent)
    - 3P_O (Offensive 3 point shots made)
    - 3P_D (3 point shots made by opponent)
    - Finish Dum (How many games each team played; used instead of POSTSEASON category)
    - SEED
    - YEAR
- During development of our site, we chose to only use 10 categories as we believed added them to our site would cause the view to become crowded. The categories we chose to later not implement were as follows:
    - ORB (Offensive Rebounds)
    - DRB (Defensive Rebounds)
    - FTR (Free Throw Percentage Made)
    - FTRD (Free Throw Percentage Made by Opponent)

## Explanatory Data Analysis:
- 

What visualizations did you use to initially look at your data? What insights did you gain? How did these insights inform your design?

## Design Evolution:
- Our first task in creating this final project was creating several different drawings of what the site might possibly look like. Below is two of our initial drawings:
![drawing1](img/peterinitialdraft.jpeg)
![drawing2](img/timinitialdraft.jpeg)
- After creating our initial ideas, we looked at both and decided what we wanted our final site to look like and what features we wanted to include. Our drawing for our final site looked like this:
![drawing3](img/teammeetingdraft.jpeg)
- While we had lots of possible ideas for filtering techniques, we decided to scale down to the ones we as a team deemed as essential to creating a good interactive visualization. These ended up being the five filters that we still have in the final version of our site. The only way we deviated from our proposal was scaling down a little bit due to time constraints.
- Upon going to class on Tuesday (March 3rd), we decided to change the court graphic to be two seperate vertical courts instead of one connected horizontal court. This is what the initial first draft of the coded site looked like: 
![drawing4](img/firstdraftss.png)
- We also created a drawing of what the new layout with the two seperated courts would look like:
![drawing4](img/IMG_1863.jpg)
- Our very final implementation of the site looks like this:
FINAL SCREENSHOT
- Perceptual and Design Principles learned in the Course: ???????


## Implementation:
- 

Describe the intent and functionality of the interactive visualizations you implemented. Provide clear and well-referenced images showing the key design and interaction elements.


## Evaluation:
- 
What did you learn about the data by using your visualizations? How did you answer your questions? How well does your visualization work, and how could you further improve it?

# Project Website Link
- Our final website can be found at this link: LINK HERE


# Outside Libraries and References:

## Libraries:
- [d3.js](https://d3js.org/)

## References:
- [barttorvik.com](https://barttorvik.com/#)
- [SelfieCity](https://selfiecity.net/selfiexploratory/?dataset=%5Blondon%5D)
- [Sports Reference](https://www.sports-reference.com/cbb/)
