import Input
import re
import zipfile

class TextAnalyzer:
    """
    This class analyzes a given text for various characteristics such as sentence count,
    average lengths, smiley count, and specific word patterns.

    Attributes:
    - __sentences (list): A list to hold counts of narrative, interrogative, and imperative sentences.
    - __avgSentLen (float): Average length of sentences.
    - __avgWordLen (float): Average length of words.
    - __smilesCount (int): Count of smileys in the text.
    - __len (int): Target length for certain operations.
    - __time (list): List to hold found time patterns.
    """
    __sentences = [0,0,0] 
    __avgSentLen=0
    __avgWordLen=0
    __smilesCount=0
    __len = 0
    __time = []

    def __init__(self,text,length):
        """
        Initializes the TextAnalyzer with a given text and target length.

        Parameters:
        - text (str): The text to analyze.
        - length (int): The target length for specific operations.
        """
        self.__text = self.read_file()
        self.__len = length

    def count_narrative(self):
        """Counts the number of narrative sentences in the text."""
        self.__sentences[0]=len(re.findall(r'[A-ZА-Я][^.!?]*[.]',self.__text))
    
    def count_interogative(self):
        """Counts the number of interogative sentences in the text."""
        self.__sentences[1]=len(re.findall(r'[A-ZА-Я][^.!?]*[?]',self.__text))
    
    def count_imperative(self):
        """Counts the number of imperative sentences in the text."""
        self.__sentences[2]=len(re.findall(r'[A-ZА-Я][^.!?]*[!]',self.__text))

    def avg_sent_leg(self):
        """Calculates the average length of sentences in the text."""
        sentences = re.split(r'[.!?]+', self.__text)
        num_sentences = len(sentences) - 1  

        total_sentences_length = 0
        for sentence in sentences:
            words = re.findall(r'\b\w+\b', sentence)
            total_sentences_length += len(words)

        self.__avgSentLen = total_sentences_length / num_sentences if num_sentences > 0 else 0

    def avg_word_len(self):
        """Calculates the average length of words in the text."""
        words = re.findall(r'\b\w+\b', self.__text)
        total_word_length = sum(len(word) for word in words)
        self.__avgWordLen = total_word_length / len(words)
        
    def count_smiles(self):
        """Counts the number of smileys in the text."""
        self.__smilesCount = len(re.findall(r'[;:]-*[()\]\[]+',self.__text))

    def replaceChars(self):
        """
        Replaces the last three characters of each word of a specified length with '$$$'.

        Returns:
        - str: The modified text.
        """
        def replace(word):
            return word.group(0)[:-3]+'$$$'

        return re.sub(r'\b\w{'+str(self.__len)+r'}\w{3}\b',replace,self.__text)
    
    def findTimes(self):
        """
        Finds all time patterns in the format HH:MM in the text.

        Returns:
        - list: A list of found time strings.
        """
        times = re.findall(r'\b([01]?\d|2[0-3]):([0-5]\d)\b', self.__text)
        return [f"{hour}:{minute}" for hour, minute in times]

    def wordsAmount(self):
        """
        Finds the maximum length of words in the text.

        Returns:
        - int: The length of the longest word.
        """
        words = self.__text.split()
        return max((len(word) for word in words), default=0)

    def findWordsWithPunctuation(self):
        """
        Finds words that are followed by punctuation (.,).

        Returns:
        - list: A list of words followed by punctuation.
        """
        return re.findall(r'\b\w+\b(?=[,.])',self.__text)

    def longestEndWithE(self):
        """
        Finds the longest word that ends with the letter 'е'.

        Returns:
        - str: The longest word that ends with 'е'.
        """
        return max(re.findall(r'\b\w+е\b',self.__text),key=len)

    def __call__(self):
        """Executes all analysis methods and returns a summary of the results."""
        self.avg_sent_leg()
        self.avg_word_len()
        self.count_imperative()
        self.count_interogative()
        self.count_narrative()
        self.count_smiles()

        s = str(f"Total senteces count: {sum(self.__sentences)}\n"+
                f"\tNarrative: {self.__sentences[0]}\n"+
                f"\tInterogative: {self.__sentences[1]}\n"+
                f"\tImperative: {self.__sentences[2]}\n"+
                f"Average length of sentence: {self.__avgSentLen}\n"+
                f"Average length of word: {self.__avgWordLen}\n"+
                f"Smiles count: {self.__smilesCount}\n"+
                f"Edited text (last 3 chars replace to $$$): {self.replaceChars()}\n"+
                f"Smiles count: {self.__smilesCount}\n"+
                f"Time in text: {self.findTimes()}\n"+
                f"Amount of words with max length: {self.wordsAmount()}\n"+
                f"Words with '.' or ',': {self.findWordsWithPunctuation()}\n"+
                f"Longest end with e: {self.longestEndWithE()}\n"
                )
        return s

class FileAnalyzer(TextAnalyzer):
    """
    This class extends TextAnalyzer to read text from a file.

    Attributes:
    - __filepath (str): The path to the file containing the text.
    """
    def __init__(self,filepath,length):
        self.__filepath = filepath
        super().__init__(self.read_file(),length)
    def read_file(self):
        """
        Reads text from the specified file.

        Returns:
        - str: The content of the file.
        """
        try:
            with open(self.__filepath, 'r', encoding='utf-8') as file:
                return file.read()
        except FileNotFoundError:
            print(f"{self.__filepath} not found")
            return ""
        except Exception as e:
            print(f"Can`t read file: {e}")
            return ""
    
def task2():
    """
    Main function to analyze text from a file and output results to another file.

    It prompts for target length, performs text analysis, and saves results to output2.txt.
    """
    length = Input.get("Write target length: ",str)
    analyzer = FileAnalyzer("input2.txt",length)
    data = analyzer()
    with open("output2.txt", "w") as file:
        file.write(data)
    with open("output2.txt", "r") as file:
        file_content = file.read()
        print(file_content)

    create_zip_archive("arch2.zip", "output2.txt")
    return

def create_zip_archive(output_file, file_to_archive):
    """
    Creates a zip archive containing the specified file.

    Parameters:
    - output_file (str): The name of the zip file to create.
    - file_to_archive (str): The name of the file to include in the zip.
    """
    with zipfile.ZipFile(output_file, 'w', compression=zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.write(file_to_archive)
        archive_info = zip_file.getinfo(file_to_archive)
        print("Имя файла в архиве: {}".format(archive_info.filename))
        print("Размер сжатого файла: {} байт".format(archive_info.compress_size))
        print("Размер несжатого файла: {} байт".format(archive_info.file_size))
        print("Метод сжатия: {}".format(archive_info.compress_type))
