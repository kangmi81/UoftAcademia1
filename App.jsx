import { useState, useEffect } from "react";
import "./App.css";

const GPA_MAP = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "D-": 0.7,
  "F": 0.0,
};

function getLetterGrade(percent) {
  if (percent >= 90) return "A+";
  if (percent >= 85) return "A";
  if (percent >= 80) return "A-";
  if (percent >= 77) return "B+";
  if (percent >= 73) return "B";
  if (percent >= 70) return "B-";
  if (percent >= 67) return "C+";
  if (percent >= 63) return "C";
  if (percent >= 60) return "C-";
  if (percent >= 57) return "D+";
  if (percent >= 53) return "D";
  if (percent >= 50) return "D-";
  return "F";
}

function App() {
  const loadCourses = () => {
    const saved = localStorage.getItem("courses");
    if (!saved) return [
      { name: "Course 1", assignments: [] },
      { name: "Course 2", assignments: [] },
      { name: "Course 3", assignments: [] },
      { name: "Course 4", assignments: [] },
      { name: "Course 5", assignments: [] },
    ];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((c) => ({
        ...c,
        assignments: (c.assignments || []).map((a) => ({
          ...a,
          score: Number(a.score),
          outOf: Number(a.outOf),
          weight: Number(a.weight),
        })),
      }));
    } catch {
      return [];
    }
  };

  const loadGpaCourses = () => {
    const saved = localStorage.getItem("gpaCourses");
    if (!saved) return [
      { name: "Course 1", weight: 0.5, grade: "" },
      { name: "Course 2", weight: 0.5, grade: "" },
      { name: "Course 3", weight: 0.5, grade: "" },
      { name: "Course 4", weight: 0.5, grade: "" },
      { name: "Course 5", weight: 0.5, grade: "" },
    ];
    try {
      const parsed = JSON.parse(saved);
      return parsed.map((c) => ({
        ...c,
        weight: Number(c.weight),
      }));
    } catch {
      return [];
    }
  };

  const [courses, setCourses] = useState(loadCourses);
  const [gpaCourses, setGpaCourses] = useState(loadGpaCourses);
  const [cgpa, setCgpa] = useState(() => localStorage.getItem("cgpa") || "");
  const [earnedCredits, setEarnedCredits] = useState(() => localStorage.getItem("earnedCredits") || "");
  const [selectedCourseIndex, setSelectedCourseIndex] = useState(null);
  const [newAssignment, setNewAssignment] = useState({ name: "", score: "", outOf: "", weight: "" });

  useEffect(() => {
    localStorage.setItem("courses", JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem("gpaCourses", JSON.stringify(gpaCourses));
  }, [gpaCourses]);

  useEffect(() => {
    localStorage.setItem("cgpa", cgpa);
  }, [cgpa]);

  useEffect(() => {
    localStorage.setItem("earnedCredits", earnedCredits);
  }, [earnedCredits]);

  const calculateFinalGrade = (assignments) => {
    if (assignments.length === 0) return null;
    const totalPercent = assignments.reduce((sum, a) => {
      return sum + (Number(a.score) / Number(a.outOf)) * 100;
    }, 0);
    return totalPercent / assignments.length;
  };

  const updateCourseName = (index, name) => {
    const updated = [...courses];
    updated[index].name = name;
    setCourses(updated);

    const updatedGpa = [...gpaCourses];
    if (updatedGpa[index]) {
      updatedGpa[index].name = name;
      setGpaCourses(updatedGpa);
    }
  };

  const addAssignment = () => {
    const updated = [...courses];
    updated[selectedCourseIndex].assignments.push({
      ...newAssignment,
      score: Number(newAssignment.score),
      outOf: Number(newAssignment.outOf),
      weight: Number(newAssignment.weight),
    });
    setCourses(updated);
    setNewAssignment({ name: "", score: "", outOf: "", weight: "" });
  };

  const removeAssignment = (i) => {
    const updated = [...courses];
    updated[selectedCourseIndex].assignments.splice(i, 1);
    setCourses(updated);
  };
  const addCourse = () => {
    if (courses.length < 6) {
      const newIndex = courses.length + 1;
      setCourses([...courses, { name: `Course ${newIndex}`, assignments: [] }]);
      setGpaCourses([...gpaCourses, { name: `Course ${newIndex}`, weight: 0.5, grade: "" }]);
    }
  };

  const removeCourse = (index) => {
    const updated = [...courses];
    updated.splice(index, 1);
    setCourses(updated);

    const gpaUpdated = [...gpaCourses];
    gpaUpdated.splice(index, 1);
    setGpaCourses(gpaUpdated);
  };

  const handleGpaChange = (index, field, value) => {
    const updated = [...gpaCourses];
    updated[index][field] = field === "weight" ? parseFloat(value) : value;
    setGpaCourses(updated);
  };

  const addGpaCourse = () => {
    if (gpaCourses.length < 10) {
      setGpaCourses([...gpaCourses, { name: "", weight: 0.5, grade: "" }]);
    }
  };

  const removeGpaCourse = (index) => {
    const updated = [...gpaCourses];
    updated.splice(index, 1);
    setGpaCourses(updated);
  };

  const calculateSGPA = () => {
    let total = 0;
    let totalCredits = 0;
    gpaCourses.forEach(({ weight, grade }) => {
      const gpa = GPA_MAP[grade];
      if (gpa !== undefined) {
        total += gpa * weight;
        totalCredits += weight;
      }
    });
    return totalCredits ? (total / totalCredits).toFixed(2) : "TBD";
  };

  const calculateUpdatedCGPA = () => {
    const sgpa = parseFloat(calculateSGPA());
    const current = parseFloat(cgpa);
    const credits = parseFloat(earnedCredits);
    const totalNewCredits = gpaCourses.reduce((acc, cur) => acc + (cur.grade ? cur.weight : 0), 0);

    if (isNaN(sgpa) || isNaN(current) || isNaN(credits)) return "TBD";

    const totalPoints = current * credits + sgpa * totalNewCredits;
    const totalCredits = credits + totalNewCredits;

    return totalCredits ? (totalPoints / totalCredits).toFixed(2) : "TBD";
  };

  return (
    <div className="container">
      {!selectedCourseIndex && (
        <>
          <h1 className="heading">📘 UofT Academia</h1>
          <div className="grid">
            {courses.map((course, i) => {
              const final = calculateFinalGrade(course.assignments);
              const letter = final !== null ? getLetterGrade(final) : "N/A";

              return (
                <div key={i} className="card">
                  <div onClick={() => setSelectedCourseIndex(i)}>
                    <input
                      className="course-name"
                      value={course.name}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateCourseName(i, e.target.value)}
                    />
                    <div className="grade">{letter}</div>
                  </div>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCourse(i);
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
            {courses.length < 6 && (
              <div className="card add-card" onClick={addCourse}>
                <div className="plus">＋</div>
                <div className="label">Add Course</div>
              </div>
            )}
          </div>

          <h2 className="heading" style={{ marginTop: "40px" }}>🎓 GPA Calculator</h2>

          <div className="gpa-panel">
            <div className="gpa-inputs">
              <label>Current CGPA from ACORN</label>
              <input
                type="number"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
              />
              <label>Credits Earned So Far</label>
              <input
                type="number"
                value={earnedCredits}
                onChange={(e) => setEarnedCredits(e.target.value)}
              />
            </div>

            <table className="gpa-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Weight</th>
                  <th>Grade</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gpaCourses.map((course, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        value={course.name}
                        onChange={(e) => handleGpaChange(i, "name", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={course.weight}
                        onChange={(e) => handleGpaChange(i, "weight", e.target.value)}
                      />
                    </td>
                    <td>
                      <select
                        value={course.grade}
                        onChange={(e) => handleGpaChange(i, "grade", e.target.value)}
                      >
                        <option value="">Select</option>
                        {Object.keys(GPA_MAP).map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button onClick={() => removeGpaCourse(i)}>❌</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="gpa-buttons">
              <button onClick={addGpaCourse}>Add Course</button>
            </div>

            <div className="gpa-results">
              <div>SGPA: {calculateSGPA()}</div>
              <div>CGPA: {calculateUpdatedCGPA()}</div>
            </div>
          </div>
        </>
      )}

      {selectedCourseIndex !== null && (
        <div className="course-page">
          <button className="back-btn" onClick={() => setSelectedCourseIndex(null)}>← Back</button>
          <h2>{courses[selectedCourseIndex].name}</h2>
          <div className="form">
            <input placeholder="Assignment name" value={newAssignment.name} onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })} />
            <input type="number" placeholder="Score" value={newAssignment.score} onChange={(e) => setNewAssignment({ ...newAssignment, score: e.target.value })} />
            <input type="number" placeholder="Out of" value={newAssignment.outOf} onChange={(e) => setNewAssignment({ ...newAssignment, outOf: e.target.value })} />
            <input type="number" placeholder="Weight (%)" value={newAssignment.weight} onChange={(e) => setNewAssignment({ ...newAssignment, weight: e.target.value })} />
            <button onClick={addAssignment}>+ Add Assignment</button>
          </div>
          <div>
            {courses[selectedCourseIndex].assignments.map((a, i) => {
              const percent = ((a.score / a.outOf) * 100).toFixed(1);
              const letter = getLetterGrade(percent);
              return (
                <div key={i} className="assignment">
                  <b>{a.name}</b>: {a.score}/{a.outOf} ({percent}%) → {letter}
                  <button className="remove-btn" onClick={() => removeAssignment(i)}>❌</button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
