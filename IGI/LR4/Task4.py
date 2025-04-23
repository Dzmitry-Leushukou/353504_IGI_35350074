import Input
from abc import ABC,abstractmethod
import math
import matplotlib.pyplot as plt


class GeometricFigure(ABC):
    @abstractmethod
    def area(self):
        pass

class FigureColor:
    def __init__(self,color):
        self.__color = color
    
    @property
    def color(self):
        return self.__color
    
    @color.setter
    def color(self,val):
        self.__color=val

class Triangle(GeometricFigure):
    __name  = "Triangle"

    def __init__(self,color,R):
        self.__color = FigureColor(color)
        self.__side = R*math.sqrt(3)

    @property
    def name(self):
        return self.__name
    
    def area(self):
        return self.__side**2 * math.sqrt(3) / 4.0
    
    def draw(self):
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
        return f"{self.name} with side = {self.__side} and area = {self.area()}"
    

def task4():
    R = Input.get("Write R: ",float)
    color = Input.get("Write color of figure: ",str)
    try:
        triangle = Triangle(color,R)
        print(triangle)
        triangle.draw()
    except Exception as e:
        print(f"Error: {e}")