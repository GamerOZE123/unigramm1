import { useState, useEffect, useRef } from "react";
import Layout from "@/components/layout/Layout";
import MobileLayout from "@/components/layout/MobileLayout";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, Download, GraduationCap, Clock, BookOpen, Search } from "lucide-react";

interface University {
  id: string;
  name: string;
}

interface Course {
  id: string;
  university_id: string;
  course_name: string;
  duration_years: number;
  total_semesters: number;
  force_enable_graduation: boolean;
  created_at: string;
  universities?: { name: string };
}

export default function AdminCourses() {
  const isMobile = useIsMobile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUniversity, setFilterUniversity] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    university_id: "",
    course_name: "",
    duration_years: 4,
    total_semesters: 8,
    force_enable_graduation: false,
  });

  useEffect(() => {
    fetchCourses();
    fetchUniversities();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("university_courses")
        .select(`
          *,
          universities (name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setUniversities(data || []);
    } catch (error) {
      console.error("Error fetching universities:", error);
    }
  };

  const handleAddCourse = async () => {
    if (!formData.university_id || !formData.course_name) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { error } = await supabase.from("university_courses").insert([formData]);

      if (error) throw error;

      toast.success("Course added successfully");
      setIsAddDialogOpen(false);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      console.error("Error adding course:", error);
      toast.error(error.message || "Failed to add course");
    }
  };

  const handleEditCourse = async () => {
    if (!selectedCourse) return;

    try {
      const { error } = await supabase
        .from("university_courses")
        .update(formData)
        .eq("id", selectedCourse.id);

      if (error) throw error;

      toast.success("Course updated successfully");
      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      resetForm();
      fetchCourses();
    } catch (error: any) {
      console.error("Error updating course:", error);
      toast.error(error.message || "Failed to update course");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from("university_courses")
        .delete()
        .eq("id", courseId);

      if (error) throw error;

      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (error: any) {
      console.error("Error deleting course:", error);
      toast.error(error.message || "Failed to delete course");
    }
  };

  const openEditDialog = (course: Course) => {
    setSelectedCourse(course);
    setFormData({
      university_id: course.university_id,
      course_name: course.course_name,
      duration_years: course.duration_years,
      total_semesters: course.total_semesters,
      force_enable_graduation: course.force_enable_graduation,
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      university_id: "",
      course_name: "",
      duration_years: 4,
      total_semesters: 8,
      force_enable_graduation: false,
    });
  };

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

        // Expected headers: university_name, course_name, duration_years, total_semesters, force_enable_graduation
        const universityNameIndex = headers.indexOf("university_name");
        const courseNameIndex = headers.indexOf("course_name");
        const durationIndex = headers.indexOf("duration_years");
        const semestersIndex = headers.indexOf("total_semesters");
        const forceGradIndex = headers.indexOf("force_enable_graduation");

        if (courseNameIndex === -1) {
          toast.error("CSV must have 'course_name' column");
          return;
        }

        const coursesToAdd: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map(v => v.trim());
          if (values.length < 2) continue;

          const universityName = universityNameIndex >= 0 ? values[universityNameIndex] : "";
          const courseName = values[courseNameIndex];
          const durationYears = durationIndex >= 0 ? parseInt(values[durationIndex]) || 4 : 4;
          const totalSemesters = semestersIndex >= 0 ? parseInt(values[semestersIndex]) || durationYears * 2 : durationYears * 2;
          const forceGrad = forceGradIndex >= 0 ? values[forceGradIndex]?.toLowerCase() === "true" : false;

          // Find university by name
          const university = universities.find(u => 
            u.name.toLowerCase() === universityName.toLowerCase()
          );

          if (!university && universityName) {
            errors.push(`Row ${i + 1}: University "${universityName}" not found`);
            continue;
          }

          if (university) {
            coursesToAdd.push({
              university_id: university.id,
              course_name: courseName,
              duration_years: durationYears,
              total_semesters: totalSemesters,
              force_enable_graduation: forceGrad,
            });
          }
        }

        if (coursesToAdd.length > 0) {
          const { error } = await supabase.from("university_courses").insert(coursesToAdd);
          if (error) throw error;
          toast.success(`Successfully imported ${coursesToAdd.length} courses`);
          fetchCourses();
        }

        if (errors.length > 0) {
          toast.warning(`${errors.length} rows had errors`, {
            description: errors.slice(0, 3).join(", "),
          });
        }
      } catch (error: any) {
        console.error("Error importing CSV:", error);
        toast.error("Failed to import CSV");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  };

  const exportCSV = () => {
    const headers = ["university_name", "course_name", "duration_years", "total_semesters", "force_enable_graduation"];
    const rows = courses.map(course => [
      course.universities?.name || "",
      course.course_name,
      course.duration_years,
      course.total_semesters,
      course.force_enable_graduation,
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "university_courses.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.universities?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUniversity = filterUniversity === "all" || course.university_id === filterUniversity;
    return matchesSearch && matchesUniversity;
  });

  const CourseForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="university">University *</Label>
        <Select
          value={formData.university_id}
          onValueChange={(value) => setFormData({ ...formData, university_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select university" />
          </SelectTrigger>
          <SelectContent>
            {universities.map((uni) => (
              <SelectItem key={uni.id} value={uni.id}>
                {uni.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="courseName">Course Name *</Label>
        <Input
          id="courseName"
          value={formData.course_name}
          onChange={(e) => setFormData({ ...formData, course_name: e.target.value })}
          placeholder="e.g., Computer Science"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (Years)</Label>
          <Input
            id="duration"
            type="number"
            min={1}
            max={10}
            value={formData.duration_years}
            onChange={(e) => {
              const years = parseInt(e.target.value) || 4;
              setFormData({
                ...formData,
                duration_years: years,
                total_semesters: years * 2,
              });
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="semesters">Total Semesters</Label>
          <Input
            id="semesters"
            type="number"
            min={1}
            max={20}
            value={formData.total_semesters}
            onChange={(e) => setFormData({ ...formData, total_semesters: parseInt(e.target.value) || 8 })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div>
          <p className="font-medium">Force Enable Graduation</p>
          <p className="text-sm text-muted-foreground">Allow graduation button regardless of semester</p>
        </div>
        <Switch
          checked={formData.force_enable_graduation}
          onCheckedChange={(checked) => setFormData({ ...formData, force_enable_graduation: checked })}
        />
      </div>

      <DialogFooter>
        <Button onClick={onSubmit}>{submitLabel}</Button>
      </DialogFooter>
    </div>
  );

  const content = (
    <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            University Courses
          </h1>
          <p className="text-muted-foreground mt-1">Manage course durations and graduation settings</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCSVImport}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Course</DialogTitle>
                <DialogDescription>Create a new course with custom duration settings</DialogDescription>
              </DialogHeader>
              <CourseForm onSubmit={handleAddCourse} submitLabel="Add Course" />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{universities.length}</p>
                <p className="text-sm text-muted-foreground">Universities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">
                  {courses.length > 0 ? (courses.reduce((acc, c) => acc + c.duration_years, 0) / courses.length).toFixed(1) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Avg Duration (yrs)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                {courses.filter(c => c.force_enable_graduation).length}
              </Badge>
              <div>
                <p className="text-sm text-muted-foreground">Force Graduation</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filterUniversity} onValueChange={setFilterUniversity}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Course List</CardTitle>
          <CardDescription>
            {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No courses found. Add some courses to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>University</TableHead>
                    <TableHead>Course Name</TableHead>
                    <TableHead className="text-center">Duration (Years)</TableHead>
                    <TableHead className="text-center">Total Semesters</TableHead>
                    <TableHead className="text-center">Force Graduation</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">{course.universities?.name || "Unknown"}</TableCell>
                      <TableCell>{course.course_name}</TableCell>
                      <TableCell className="text-center">{course.duration_years}</TableCell>
                      <TableCell className="text-center">{course.total_semesters}</TableCell>
                      <TableCell className="text-center">
                        {course.force_enable_graduation ? (
                          <Badge className="bg-green-500/10 text-green-600">Enabled</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(course)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Course?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{course.course_name}" from {course.universities?.name}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCourse(course.id)}
                                  className="bg-destructive text-destructive-foreground"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course duration and settings</DialogDescription>
          </DialogHeader>
          <CourseForm onSubmit={handleEditCourse} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>

      {/* CSV Format Info */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Import Format</CardTitle>
          <CardDescription>Use this format when importing courses via CSV</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg font-mono text-sm overflow-x-auto">
            <p>university_name,course_name,duration_years,total_semesters,force_enable_graduation</p>
            <p className="text-muted-foreground">Arizona State University,Computer Science,4,8,false</p>
            <p className="text-muted-foreground">SNU,Medicine,6,12,true</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <Layout>{content}</Layout>;
}
