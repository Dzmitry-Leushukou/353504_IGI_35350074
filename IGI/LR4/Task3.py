import Input
import math
from tabulate import tabulate
from statistics import median, mode, variance, stdev
import matplotlib.pyplot as plt
from decimal import Decimal
import numpy as np

class Analyzer:
    """
    Base class for different types of analyzers.
    """
    def graph(self):
        """Placeholder method for graphing functionality."""
        print("Grapha ne budet")

class SequenceAnalyzer(Analyzer):
    """
    Analyzes a sequence for statistical properties and computes the sine of x using the Taylor series expansion.

    Attributes:
    - __seq (list): The sequence of approximations.
    - _x (float): The input value for which the sine is calculated.
    - _eps (float): The precision for the approximation.
    """
    def __init__(self,x,eps):
        """
        Initializes the SequenceAnalyzer with given x and epsilon values.

        Parameters:
        - x (float): The value for which to calculate sin(x).
        - eps (float): The precision for the approximation.
        """
        self.__seq = []
        self._x = x
        self._eps = eps
    
    @property
    def sequence(self):
        """Returns the sequence of approximations."""
        return self.__seq
    
    def calculate_mean(self):
        """Calculates the mean of the sequence."""
        return sum(self.sequence) / len(self.sequence)

    def calculate_median(self):
        """Calculates the median of the sequence."""
        return median(self.sequence)

    def calculate_mode(self):
        """Calculates the mode of the sequence."""
        return mode(self.sequence)

    def calculate_variance(self):
        """Calculates the variance of the sequence."""
        return variance(self.sequence)

    def calculate_standard_deviation(self):
        """Calculates the standard deviation of the sequence."""
        return stdev(self.sequence)
    
    @staticmethod
    def calculate_actual_value(x):
        """Calculates the actual value based on the input x using the natural logarithm."""
        return math.log(1 + x)

   
    def find(self):
        """
        Computes the approximation of sin(x) using Taylor series expansion.

        Returns:
        - float: The approximation of sin(x).

        Raises:
        - ValueError: If more than 500 iterations are needed to reach the desired precision.
        """
        iter = 0
        sign = 1  
        approximation = Decimal(0)
        term = Decimal(2)

        while abs(term) >= Decimal(self._eps): 
            term = Decimal(sign) * (Decimal(self._x) ** (2 * iter + 1)) / Decimal(math.factorial(2 * iter + 1))
            sign *= -1 
            approximation += term
            iter += 1
            self.__seq.append(approximation)
            if iter > 500:
                raise ValueError(f"Can't reach eps = {self._eps} for sin(x) by 500 iterations")
            self._iter = iter
            self._approximation = approximation
        return float(approximation)
    
    def table(self):
        """
        Creates a table of results including x, number of iterations, approximated value, actual value, and epsilon.

        Returns:
        - str: A formatted table as a string.
        """
        data = [[self._x, self._iter, float(self._approximation), math.sin(self._x), self._eps]]
        headers = ["x", "n", "F(x)", "Math F(x)", "eps"]
        table = tabulate(data, headers=headers)
        return table

    def real(self,x):
        """Calculates the actual sine of x using the math library."""
        return math.sin(x)
def task3():
    """
    Function to compute sin(x) approximation using Taylor series expansion with user-defined precision.

    Args: 
    - None

    Returns:
    - None
    
    Raises:
    - ValueError: If the required precision cannot be achieved within 500 iterations.
    """
    x = Input.get("Write x (x = [-0.999999999999; 0.999999999999]): ",float,-0.999999999999,0.999999999999)
    eps = Input.get("Write eps (eps = [0; 1]): ",float,0,1)
    analyzer = SequenceAnalyzer(x,eps)
    try:
        ans = analyzer.find()
        table = analyzer.table()
        print(table)
        print(f"Average value: {analyzer.calculate_mean()}")
        print(f"Median: {analyzer.calculate_median()}")
        print(f"Mode: {analyzer.calculate_mode()}")
        print(f"Variance: {analyzer.calculate_variance()}")
        print(f"Standard deviation: {analyzer.calculate_standard_deviation()}")
        x_values = np.linspace(0, 1, len(analyzer.sequence))
        y_values = analyzer.sequence

        plt.plot(x_values, y_values, color="blue", label="F(x)")
        plt.plot(x_values, [analyzer.real(x)] * len(analyzer.sequence), color="red",
                linestyle="--", label="Math F(x)")
        plt.xlabel('n')
        plt.ylabel('F(x)')
        plt.legend()
        plt.grid(True)
        plt.title("Taylor`s sin(x)")
        plt.savefig("Task3.png")
        #plt.show()
    except Exception as e:
        print(f'Error: {e}')