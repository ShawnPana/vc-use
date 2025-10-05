from typing import List, Optional, Iterator
from pydantic import BaseModel, RootModel

class PrettyBaseModel(BaseModel):
    def to_dict(self):
        return self.model_dump() if hasattr(self, "model_dump") else self.dict()
    def to_json(self, **kwargs):
        return self.model_dump_json(**kwargs) if hasattr(self, "model_dump_json") else self.json(**kwargs)

class SocialMedia(PrettyBaseModel):
    linkedin: Optional[str] = None
    X: Optional[str] = None
    other: Optional[str] = None
    def __str__(self) -> str:
        return (
            f"LinkedIn: {self.linkedin or 'N/A'}, "
            f"X: {self.X or 'N/A'}, "
            f"Other: {self.other or 'N/A'}"
        )

class Founder(PrettyBaseModel):
    name: str
    social_media: SocialMedia
    personal_website: Optional[str] = None
    bio: Optional[str] = None
    def __str__(self) -> str:
        return (
            f"Name: {self.name}\n"
            f"Social Media: {self.social_media}\n"
            f"Personal Website: {self.personal_website or 'N/A'}\n"
            f"Bio: {self.bio or 'N/A'}"
        )

class FounderList(PrettyBaseModel):
    founders: List[Founder]
    def __iter__(self) -> Iterator[Founder]:
        return iter(self.founders)
    def __len__(self) -> int:
        return len(self.founders)
    def __getitem__(self, index) -> Founder:
        return self.founders[index]

class Company(PrettyBaseModel):
    company_website: str
    company_bio: str
    founders_info: FounderList
    company_summary: str
    def __str__(self) -> str:
        founders_str = "\n\n".join(str(f) for f in self.founders_info) or "N/A"
        return (
            f"Company Website: {self.company_website}\n"
            f"Company Biography: {self.company_bio}\n"
            f"Founders Information:\n{founders_str}\n"
            f"Company Summary: {self.company_summary}"
        )

class Hype(PrettyBaseModel):
    hype_summary: str
    numbers: Optional[str] = None
    recent_news: Optional[str] = None

    def __str__(self) -> str:
        return f"Hype Summary: {self.hype_summary}"

# Example
if __name__ == "__main__":
    sm = SocialMedia(linkedin="https://linkedin.com/in/example", X="@example")
    founder = Founder(name="Alice Smith", social_media=sm, bio="Tech enthusiast.")
    company = Company(
        company_website="https://example.com",
        company_bio="We build AI tools.",
        founders_info=FounderList(root=[founder]),  # <- RootModel wrapper here
        company_summary="AI for business efficiency."
    )
    for f in company.founders_info:
        print(f, "\n-----")
    print("\nAs dict:\n", company.to_dict())
    print("\nAs JSON:\n", company.to_json(indent=2))
