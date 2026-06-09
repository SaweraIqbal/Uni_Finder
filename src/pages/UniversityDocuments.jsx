import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

function UniversityDocuments() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState({
    universityName: "",
    registrationNo: "",
    address: "",
    contactNo: "",

    hecCertificate: null,
    charterCertificate: null,
    accreditationDocument: null,
    universityLogo: null,
  });

  const handleChange = (e) => {
    setDocuments({
      ...documents,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    setDocuments({
      ...documents,
      [e.target.name]: e.target.files[0],
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userId = sessionStorage.getItem("userId");
    if (!userId) {
      toast.error("Session expired. Please log in again.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    const formData = new FormData();
    formData.append("user_uid", userId);

    Object.keys(documents).forEach((key) => {
      formData.append(key, documents[key]);
    });

    try {
      const res = await fetch(
        "http://localhost:5000/api/university/documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (res.ok) {
        toast.success(
          "Documents submitted successfully. Waiting for admin approval."
        );

        setTimeout(() => {
          navigate("/university/dashboard");
        }, 2000);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <ToastContainer />

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl p-8">

        <h1 className="text-3xl font-bold text-center mb-2">
          University Verification
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Submit required documents for approval
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          <input
            type="text"
            name="universityName"
            placeholder="University Name"
            value={documents.universityName}
            onChange={handleChange}
            className="border-2 border-black rounded-xl p-3"
            required
          />

          <input
            type="text"
            name="registrationNo"
            placeholder="HEC Registration Number"
            value={documents.registrationNo}
            onChange={handleChange}
            className="border-2 border-black rounded-xl p-3"
            required
          />

          <input
            type="text"
            name="contactNo"
            placeholder="Contact Number"
            value={documents.contactNo}
            onChange={handleChange}
            className="border-2 border-black rounded-xl p-3"
            required
          />

          <input
            type="text"
            name="address"
            placeholder="University Address"
            value={documents.address}
            onChange={handleChange}
            className="border-2 border-black rounded-xl p-3"
            required
          />

          <div>
            <label className="font-semibold block mb-2">
              HEC Approval Certificate
            </label>
            <input
              type="file"
              name="hecCertificate"
              onChange={handleFileChange}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Charter Certificate
            </label>
            <input
              type="file"
              name="charterCertificate"
              onChange={handleFileChange}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              Accreditation Document
            </label>
            <input
              type="file"
              name="accreditationDocument"
              onChange={handleFileChange}
              className="w-full"
              required
            />
          </div>

          <div>
            <label className="font-semibold block mb-2">
              University Logo
            </label>
            <input
              type="file"
              name="universityLogo"
              onChange={handleFileChange}
              className="w-full"
              required
            />
          </div>

          <div className="md:col-span-2 mt-4">
            <button
              type="submit"
              className="w-full bg-[#c88410] hover:bg-[#a66d0d]
              text-white py-4 rounded-xl text-lg font-semibold
              transition-all"
            >
              Submit For Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UniversityDocuments;

