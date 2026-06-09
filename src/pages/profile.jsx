import React, { useState, useEffect } from "react";
import { FaEdit } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Profile() {

  const [step, setStep] = useState(1);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    dob: "",
    age: "",
    gender: "",
    cnic: "",
    address: "",
  });

  const [docType, setDocType] = useState("");
  const [docFile, setDocFile] = useState(null);
  const [docNote, setDocNote] = useState("");


  useEffect(() => {
    const userId = sessionStorage.getItem("userId");
    if (!userId) return;

    const loadData = async () => {
      try {

       
        const userRes = await fetch(
          `http://localhost:5000/api/auth/user/${userId}`
        );
        const userData = await userRes.json();

        setFormData(prev => ({
          ...prev,
          fullName: userData.name || "",
          username: userData.username || "",
          email: userData.email || "",
        }));

        const profileRes = await fetch(
          `http://localhost:5000/api/auth/student_profile/${userId}`
        );

        const profile = await profileRes.json();

        if (profile) {
          setProfileExists(true);

          setFormData(prev => ({
            ...prev,
            dob: profile.dob ? profile.dob.split("T")[0] : "",
            age: profile.age || "",
            cnic: profile.cnic || "",
            gender: profile.gender || "",
            address: profile.address || "",
          }));
        }

      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  
  const handleCreate = async () => {

    const userId = sessionStorage.getItem("userId");

    const payload = {
      user_uid: userId,
      full_name: formData.fullName,
      username: formData.username,
      email: formData.email,
      dob: formData.dob,
      age: formData.age,
      cnic: formData.cnic,
      gender: formData.gender,
      address: formData.address,
    };

    return fetch(
      "http://localhost:5000/api/auth/Student_profile",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  };

 
  const handleUpdate = async () => {

    const userId = sessionStorage.getItem("userId");

    const payload = {
      user_uid: userId,
      full_name: formData.fullName,
      username: formData.username,
      email: formData.email,
      dob: formData.dob,
      age: formData.age,
      cnic: formData.cnic,
      gender: formData.gender,
      address: formData.address,
    };

    return fetch(
      "http://localhost:5000/api/auth/Student_profile/update",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      let res;

      if (profileExists) {
        res = await handleUpdate();
      } else {
        res = await handleCreate();
      }

      const data = await res.json();

      if (res.ok) {

        if (profileExists) {
          toast.success("Profile Updated Successfully");
        } else {
          toast.success("Profile Created Successfully");
          setProfileExists(true);
        }

      } else {
        toast.error(data.message || "Something went wrong");
      }

    } catch (error) {
      console.log(error);
      toast.error("Server Error");
    }
  };


  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  return (

    <div className="min-h-screen bg-gray-100 p-6">

   
      <div className="max-w-4xl mx-auto mb-10">
       <ToastContainer position="top-right" autoClose={2000} />
        <ol className="flex items-center w-full text-sm font-medium text-center sm:text-base">

          {[1, 2, 3].map((num) => (

            <li
              key={num}
              className={`flex items-center w-full 
              ${step >= num ? "text-orange-500" : "text-gray-400"}`}
            >

              <div className="flex items-center w-full">

                <span
                  className={`w-10 h-10 flex items-center justify-center rounded-full border-2
                  ${step >= num
                      ? "bg-orange-500 text-white border-orange-500"
                      : "border-gray-400"
                    }`}
                >
                  {num}
                </span>

                <span className="ml-3 font-semibold">

                  {num === 1 && "Basic"}
                  {num === 2 && "Personal"}
                  {num === 3 && "Document"}

                </span>

              </div>

              {num !== 3 && (
                <div className="w-full h-1 bg-gray-300 mx-4 rounded">
                  <div
                    className={`h-1 rounded bg-orange-500 transition-all duration-300
                    ${step > num ? "w-full" : "w-0"}`}
                  ></div>
                </div>
              )}

            </li>

          ))}

        </ol>

      </div>

   
      <form
         onSubmit={handleSubmit}
        className="max-w-4xl mx-auto bg-white p-8 rounded-3xl shadow-lg space-y-8"
      >

     
        {step === 1 && (

          <div className="flex flex-col md:flex-row gap-10 items-center">

      
            <div className="flex-1 space-y-4">

              <h2 className="text-3xl font-bold text-orange-500">
                Basic Info
              </h2>

              <div className="relative">

                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full border p-3 rounded-xl pr-10"
                />

                <FaEdit className="absolute right-4 top-4 text-gray-500" />

              </div>

              <div className="relative">

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className="w-full border p-3 rounded-xl pr-10"
                />

                <FaEdit className="absolute right-4 top-4 text-gray-500" />

              </div>

              <div className="relative">

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full border p-3 rounded-xl pr-10"
                />

                <FaEdit className="absolute right-4 top-4 text-gray-500" />

              </div>

            </div>

    
            <div className="flex flex-col items-center">

              <div className="relative">

                <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-orange-500 shadow-lg">

                  <img
                    src="https://i.pravatar.cc/300"
                    alt="profile"
                    className="w-full h-full object-cover"
                  />

                </div>

                <button
                  type="button"
                  className="absolute bottom-2 right-2 bg-orange-500 p-3 rounded-full text-white shadow-lg"
                >
                  <FaEdit />
                </button>

              </div>

              <p className="mt-4 text-gray-500 font-medium">
                Edit Profile Picture
              </p>

            </div>

          </div>

        )}

  
        {step === 2 && (

          <div className="space-y-5">

            <h2 className="text-3xl font-bold text-orange-500">
              Personal Info
            </h2>

            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl"
            />

            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age"
              className="w-full border p-3 rounded-xl"
            />

            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full border p-3 rounded-xl"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <input
              type="text"
              name="cnic"
              value={formData.cnic}
              onChange={handleChange}
              placeholder="CNIC"
              className="w-full border p-3 rounded-xl"
            />

            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="w-full border p-3 rounded-xl"
            />

          </div>

        )}

        
        {step === 3 && (

          <div className="space-y-5">

            <h2 className="text-3xl font-bold text-orange-500">
              Document Info
            </h2>

            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border p-3 rounded-xl"
            >
              <option value="">Select Document Type</option>
              <option value="CNIC">CNIC</option>
              <option value="Matric">Matric</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Passport">Passport</option>
            </select>

            <input
              type="file"
              onChange={(e) => setDocFile(e.target.files[0])}
              className="w-full border p-3 rounded-xl bg-white"
            />

            {docFile && (
              <p className="text-sm text-gray-600">
                Selected File: {docFile.name}
              </p>
            )}

            <textarea
              value={docNote}
              onChange={(e) => setDocNote(e.target.value)}
              placeholder="Optional Note"
              className="w-full border p-3 rounded-xl"
            />

          </div>

        )}

      
        <div className="flex justify-between pt-6">

          {step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-8 py-3 bg-gray-300 rounded-xl font-semibold"
            >
              Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              className="ml-auto px-8 py-3 bg-orange-500 text-white rounded-xl font-semibold"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              className="ml-auto px-8 py-3 bg-green-500 text-white rounded-xl font-semibold"
            >
              Update Profile
            </button>
          )}

        </div>

      </form>

    </div>
  );
}