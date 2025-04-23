import Input
import numpy as np

class DisplayMatrix:
    def display(matrix):
        print(matrix)        


class Matrix(DisplayMatrix):
    def __init__(self,rows,columns, type):
        self.__rows=rows
        self.__columns=columns
        self.__type = type
        self.__data = np.empty((rows,columns),dtype=self.__type)

    def fill(self):
        pass

    def show(self):
        DisplayMatrix.display(self.__data)

    @property
    def data(self):
        return self.__data

    @property
    def rows(self):
        return self.__rows
    
    @property
    def columns(self):
        return self.__columns
    

    @data.setter
    def data(self,value):
        self.__data = value

    @rows.setter
    def rows(self,value):
        self.__rows = value
        
    @columns.setter
    def columns(self,value):
        self.__columns = value

    
class IntMatrix(Matrix):
    def __init__(self, rows, columns):
        super().__init__(rows, columns, int)

    def fill(self):
        self.data = np.random.randint(-100, 100, size=(self.rows, self.columns))

    def find_statistic_values(self):
        return str(f"Avg value of matrix elements: {np.mean(self.data)}\n" +
                   f"Median: {np.median(self.data)}\n"+
                   f"Variance: {np.var(self.data)}\n"+
                   f"Standart deviation: {np.median(self.data)}\n"+
                   f"Coef:{np.corrcoef(self.data)}\n")
    def numPyFunc(self):
        return str(f"Array() = {np.array(self.data)}\n"+
                   f"Matrix + 2*Matrix = {self.data+self.data*2}\n"+
                   f"Sin(Matrix) = {np.sin(self.data)}"
                   )
    
    def findMinCol(self):
        sums=np.sum(self.data,axis = 0)
        min_sum = np.argmin(sums)
        print(f"Row with minimal sum(sum = {sums[min_sum]}) with index {min_sum}: {self.data[:, min_sum]}")
        print(f"It`s median (by std) is {np.median(self.data[:,min_sum])}")
        print(f"It`s median is {self.median(self.data[:,min_sum])}")

    def median(self,arr):
        sorted_arr = np.sort(arr)
        n = len(sorted_arr)
        mid = n // 2
        if n % 2 == 0:
            return (sorted_arr[mid - 1] + sorted_arr[mid]) / 2
        else:
            return sorted_arr[mid]
        
def task5():
    A = IntMatrix(Input.get("Write rows count: ",int, 0,10),Input.get("Write columns count: ",int, 0,10))
    A.fill()
    A.show()
    print(A.find_statistic_values())
    print(A.numPyFunc())
    A.findMinCol()