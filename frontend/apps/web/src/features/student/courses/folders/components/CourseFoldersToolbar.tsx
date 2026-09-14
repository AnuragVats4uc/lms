import { Search } from "lucide-react";
import { ChangeEvent } from "react";

type CourseFiltersToolbarProps = {
  search: string;
  typeFilter: string;
  sort: string;
  onChangeSearch: (event: ChangeEvent<HTMLInputElement>) => void;
  onChangeResourceSelect: (event: ChangeEvent<HTMLSelectElement>) => void;
  onChangeCourseOrder: (event: ChangeEvent<HTMLSelectElement>) => void;
};

export const CourseFolderToolbar = ({
  sort,
  search,
  typeFilter,
  onChangeSearch,
  onChangeResourceSelect,
  onChangeCourseOrder,
}: CourseFiltersToolbarProps) => {
  return (
    <div className="student-course-folder-toolbar">
      <div className="student-course-folder-heading">
        <h2 id="course-folders-title">Course folders</h2>
        <span>Browse your learning resources</span>
      </div>

      <div className="student-course-folder-controls">
        <label className="student-course-folder-search">
          <Search aria-hidden="true" size={16} />
          <input
            aria-label="Search course folders"
            onChange={onChangeSearch}
            placeholder="Search folders"
            type="search"
            value={search}
          />
        </label>

        <select
          aria-label="Filter folders by resource type"
          className="student-course-folder-select"
          onChange={onChangeResourceSelect}
          value={typeFilter}
        >
          <option value="ALL">All types</option>
          <option value="VIDEO">With videos</option>
          <option value="DOCUMENT">With documents</option>
          <option value="EXAM">With exams</option>
        </select>

        <select
          aria-label="Sort course folders"
          className="student-course-folder-select"
          onChange={onChangeCourseOrder}
          value={sort}
        >
          <option value="COURSE_ORDER">Course order</option>
          <option value="NAME">Name A–Z</option>
          <option value="RESOURCES">Most resources</option>
        </select>
      </div>
    </div>
  );
};
