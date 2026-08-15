class Report:
    def __init__(self) -> None:
        self.issues: list[str] = []

    def add(self, message: str) -> None:
        self.issues.append(message)
        print(f"  ✗ {message}")
