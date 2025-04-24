import Input
import numpy as np

class DisplayMatrix:
    """
    Class to display matrices.

    Methods:
    - display(matrix): Prints the given matrix.
    """
    def display(matrix):
        """Prints the matrix."""
        print(matrix)        


class Matrix(DisplayMatrix):
    """
    Base class for matrices.

    Attributes:
    - __rows (int): Number of rows in the matrix.
    - __columns (int): Number of columns in the matrix.
    - __type (type): Data type of the matrix elements.
    - __data (ndarray): The data of the matrix stored in a NumPy array.
    
    Methods:
    - fill(): Abstract method to fill the matrix (to be implemented in subclasses).
    - show(): Displays the matrix.
    """
    def __init__(self,rows,columns, type):
        """
        Initializes a matrix with the specified number of rows, columns, and data type.

        Parameters:
        - rows (int): Number of rows in the matrix.
        - columns (int): Number of columns in the matrix.
        - type: Data type of the matrix elements.
        """
        self.__rows=rows
        self.__columns=columns
        self.__type = type
        self.__data = np.empty((rows,columns),dtype=self.__type)

    def fill(self):
        """Fills the matrix with data (to be implemented in subclasses)."""
        pass

    def show(self):
        """Displays the matrix data."""
        DisplayMatrix.display(self.__data)

    @property
    def data(self):
        """Returns the data of the matrix."""
        return self.__data

    @property
    def rows(self):
        """Returns the number of rows in the matrix."""
        return self.__rows
    
    @property
    def columns(self):
        """Returns the number of columns in the matrix."""
        return self.__columns

    @data.setter
    def data(self,value):
        """Sets the data of the matrix."""
        self.__data = value

    @rows.setter
    def rows(self,value):
        """Sets the number of rows in the matrix."""
        self.__rows = value
        
    @columns.setter
    def columns(self,value):
        """Sets the number of columns in the matrix."""
        self.__columns = value

    
class IntMatrix(Matrix):
    """
    Class to represent a matrix of integers, inheriting from Matrix.

    Methods:
    - fill(): Fills the matrix with random integers.
    - find_statistic_values(): Computes and returns statistical values of the matrix.
    - numPyFunc(): Demonstrates some NumPy functions on the matrix.
    - findMinCol(): Finds the column with the minimum sum and calculates its statistics.
    - median(arr): Calculates the median of an array.
    """
    def __init__(self, rows, columns):
        """Initializes the integer matrix with specified rows and columns."""
        super().__init__(rows, columns, int)

    def fill(self):
        """Fills the matrix with random integers between -100 and 100."""
        self.data = np.random.randint(-100, 100, size=(self.rows, self.columns))

    def find_statistic_values(self):
        """Calculates and returns statistical values of the matrix."""
        return str(f"Avg value of matrix elements: {np.mean(self.data)}\n" +
                   f"Median: {np.median(self.data)}\n"+
                   f"Variance: {np.var(self.data)}\n"+
                   f"Standart deviation: {np.median(self.data)}\n"+
                   f"Coef:{np.corrcoef(self.data)}\n")
    def numPyFunc(self):
        """Demonstrates some NumPy functions applied to the matrix."""
        return str(f"Array() = {np.array(self.data)}\n"+
                   f"Matrix + 2*Matrix = {self.data+self.data*2}\n"+
                   f"Sin(Matrix) = {np.sin(self.data)}"
                   )
    
    def findMinCol(self):
        """Finds the column with the minimum sum and prints its statistics."""
        sums=np.sum(self.data,axis = 0)
        min_sum = np.argmin(sums)
        print(f"Row with minimal sum(sum = {sums[min_sum]}) with index {min_sum}: {self.data[:, min_sum]}")
        print(f"It`s median (by std) is {np.median(self.data[:,min_sum])}")
        print(f"It`s median is {self.median(self.data[:,min_sum])}")

    def median(self,arr):
        """
        Calculates the median of a given array.

        Parameters:
        - arr (ndarray): The array to calculate the median.

        Returns:
        - float: The median of the array.
        """
        sorted_arr = np.sort(arr)
        n = len(sorted_arr)
        mid = n // 2
        if n % 2 == 0:
            return (sorted_arr[mid - 1] + sorted_arr[mid]) / 2
        else:
            return sorted_arr[mid]
        
def task5():
    """
    Function to create an IntMatrix, fill it with random data, and display its statistics.

    Prompts the user for the number of rows and columns, then performs the analysis.
    """
    A = IntMatrix(Input.get("Write rows count: ",int, 0,10),Input.get("Write columns count: ",int, 0,10))
    A.fill()
    A.show()
    print(A.find_statistic_values())
    print(A.numPyFunc())
    A.findMinCol()