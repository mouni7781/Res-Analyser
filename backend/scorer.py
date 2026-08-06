"""
Utility scoring helpers used for local validation / fallback scoring
when the LLM cannot be reached.
"""

from typing import Dict, List


RECOMMENDATION_THRESHOLDS = {
    "Strong Fit": 80,
    "Fit": 65,
    "Partial Fit": 40,
    "Not Recommended": 0,
}


def get_recommendation(score: int) -> str:
    """Map a numeric score to a recommendation label."""
    if score >= RECOMMENDATION_THRESHOLDS["Strong Fit"]:
        return "Strong Fit"
    elif score >= RECOMMENDATION_THRESHOLDS["Fit"]:
        return "Fit"
    elif score >= RECOMMENDATION_THRESHOLDS["Partial Fit"]:
        return "Partial Fit"
    else:
        return "Not Recommended"


def calculate_skill_coverage(
    candidate_skills: List[str],
    required_skills: List[str],
) -> Dict:
    """
    Calculate how many required skills the candidate covers.

    Returns:
        dict with matching_skills, missing_skills, coverage_pct
    """
    candidate_lower = {s.lower() for s in candidate_skills}
    matching = []
    missing = []

    for skill in required_skills:
        skill_lower = skill.lower()
        # Check for exact or substring match
        matched = any(
            skill_lower in c or c in skill_lower
            for c in candidate_lower
        )
        if matched:
            matching.append(skill)
        else:
            missing.append(skill)

    coverage = (len(matching) / len(required_skills) * 100) if required_skills else 100.0
    return {
        "matching_skills": matching,
        "missing_skills": missing,
        "coverage_pct": round(coverage, 1),
    }


def fallback_score(
    candidate_skills: List[str],
    required_skills: List[str],
    preferred_skills: List[str],
    years_experience: float,
    min_experience: int,
) -> Dict:
    """
    Compute a basic suitability score without using the LLM.
    Used as a fallback when AI scoring fails.
    """
    skill_data = calculate_skill_coverage(candidate_skills, required_skills)
    preferred_data = calculate_skill_coverage(candidate_skills, preferred_skills)

    required_score = skill_data["coverage_pct"] * 0.50
    preferred_score = preferred_data["coverage_pct"] * 0.20
    exp_score = min(years_experience / max(min_experience, 1), 1.5) * 30

    total = min(int(required_score + preferred_score + exp_score), 100)
    recommendation = get_recommendation(total)

    return {
        "match_score": total,
        "matching_skills": skill_data["matching_skills"],
        "missing_skills": skill_data["missing_skills"],
        "matching_preferred_skills": preferred_data["matching_skills"],
        "experience_match": years_experience >= min_experience,
        "recommendation": recommendation,
    }
