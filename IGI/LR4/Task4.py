import Input
from abc import ABC,abstractmethod
import math
import matplotlib.pyplot as plt


class GeometricFigure(ABC):
    """
    Abstract base class for geometric figures.

    Methods:
    - area(): Abstract method to calculate the area of the figure.
    """
    @abstractmethod
    def area(self):
        pass

class FigureColor:
    """
    Class to represent the color of a geometric figure.

    Attributes:
    - __color (str): The color of the figure.
    
    Methods:
    - color: Property to get or set the color.
    """
    def __init__(self,color):
        """
        Initializes the FigureColor with a specified color.

        Parameters:
        - color (str): The color of the figure.
        """
        self.__color = color
    
    @property
    def color(self):
        """Returns the color of the figure."""
        return self.__color
    
    @color.setter
    def color(self,val):
        """Sets the color of the figure."""
        self.__color=val

class Triangle(GeometricFigure):
    """
    Class to represent a triangle, inheriting from GeometricFigure.

    Attributes:
    - __name (str): The name of the figure.
    - __color (FigureColor): The color of the triangle.
    - __side (float): The length of the sides of the triangle.

    Methods:
    - name: Returns the name of the triangle.
    - area(): Calculates the area of the triangle.
    - draw(): Draws the triangle using matplotlib.
    - __str__(): Returns a string representation of the triangle.
    """
    __name  = "Triangle"

    def __init__(self,color,R):
        """
        Initializes the Triangle with a specified color and radius.

        Parameters:
        - color (str): The color of the triangle.
        - R (float): The radius used to calculate the side length.
        """
        self.__color = FigureColor(color)
        self.__side = R*math.sqrt(3)

    @property
    def name(self):
        """Returns the name of the triangle."""
        return self.__name
    
    def area(self):
        """Calculates the area of the triangle."""
        return self.__side**2 * math.sqrt(3) / 4.0
    
    def draw(self):
        """Draws the triangle and saves it as a PNG file."""
        s = self.__side
        height = (math.sqrt(3) / 2) * s
        x = [0, s / 2, -s / 2, 0] 
        y = [0, height, height, 0]

        plt.fill(x,y,self.__color.color)
        plt.axis("equal")
        plt.xlim(-s, s)
        plt.ylim(0, height + 1)
        plt.text(0, -1, self.__name, ha="center")

        plt.savefig("triangle.png")
        #plt.show()

    def __str__(self):
        """Returns a string representation of the triangle."""
        return f"{self.name} with side = {self.__side} and area = {self.area()}"
    

def task4():
    """
    Function to create and draw a triangle based on user input.

    Prompts the user for the radius R and the color of the triangle, 
    then creates a Triangle object and draws it.
    """
    R = Input.get("Write R: ",float)
    color = Input.get("Write color of figure: ",str)
    try:
        triangle = Triangle(color,R)
        print(triangle)
        triangle.draw()
    except Exception as e:
        print(f"Error: {e}")