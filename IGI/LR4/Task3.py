import Input
import math
from tabulate import tabulate
from statistics import median, mode, variance, stdev
import matplotlib.pyplot as plt
from decimal import Decimal
import numpy as np

class Analyzer:
    def graph(self):
        print("Grapha ne budet")

class SequenceAnalyzer(Analyzer):

    def __init__(self,x,eps):
        self.__seq = []
        self._x = x
        self._eps = eps
    
    @property
    def sequence(self):
        return self.__seq
    
    def calculate_mean(self):
        # Calculates the mean of the sequence
        return sum(self.sequence) / len(self.sequence)

    def calculate_median(self):
        # Calculates the median of the sequence
        return median(self.sequence)

    def calculate_mode(self):
        # Calculates the mode of the sequence
        return mode(self.sequence)

    def calculate_variance(self):
        # Calculates the variance of the sequence
        return variance(self.sequence)

    def calculate_standard_deviation(self):
        # Calculates the variance of the sequence
        return stdev(self.sequence)
    
    @staticmethod
    def calculate_actual_value(x):
        # Calculates the actual value based on a given input 'x'
        return math.log(1 + x)

   
    def find(self):
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
        data = [[self._x, self._iter, float(self._approximation), math.sin(self._x), self._eps]]
        headers = ["x", "n", "F(x)", "Math F(x)", "eps"]
        table = tabulate(data, headers=headers)
        return table

    def real(self,x):
        return math.sin(x)
def task3():
    """
    Function to compute sin(x) approximation using Taylor series expansion by 500 iterations or less and with math function.
    Args: 
    - x (float): Argument of sin(x)
    - eps (float): Approximate value aim

    Returns:
    - table (tabulate): Table of found values

    Raises:
    - ValueError: If to find answer need more than 500 iterations
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