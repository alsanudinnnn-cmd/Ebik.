document.addEventListener("DOMContentLoaded", function () {
  // Initialize Firebase
  const database = firebase.database();

  // ⭐ Star Rating
  const stars = document.querySelectorAll("#starRating i");
  const ratingInput = document.getElementById("rating");
  stars.forEach(star => {
    star.addEventListener("click", () => {
      const value = star.getAttribute("data-value");
      ratingInput.value = value;

      stars.forEach(s => {
        if (s.getAttribute("data-value") <= value) {
          s.classList.add("text-yellow-400");
          s.classList.remove("text-gray-400");
        } else {
          s.classList.add("text-gray-400");
          s.classList.remove("text-yellow-400");
        }
      });
    });
  });

  const CLOUDINARY_CLOUD_NAME = 'drgxibq5q';
  const CLOUDINARY_UPLOAD_PRESET = 'ebikkk.';
  const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

  const reviewForm = document.getElementById("reviewForm");

  reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("firstName").value;
    const lastName = document.getElementById("lastName").value;
    const email = document.getElementById("email").value;
    const serviceNeeded = document.getElementById("serviceNeeded").value;
    const message = document.getElementById("message").value;
    const rating = ratingInput.value;

    const selectedProfile = document.querySelector('input[name="profilePic"]:checked');
    if (!selectedProfile) {
      alert("⚠️ Please select your meow profile.");
      return;
    }

    const profileUrl = selectedProfile.value;
    const productPhotoInput = document.getElementById("productPhoto");
    const productPhoto = productPhotoInput.files[0];
    let imageUrl = "";

    // ⭐ Start Upload if Image Exists
    if (productPhoto) {
      const formData = new FormData();
      formData.append("file", productPhoto);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

      const progressContainer = document.getElementById("progressContainer");
      const uploadBar = document.getElementById("uploadBar");
      const uploadProgressText = document.getElementById("uploadProgressText");

      progressContainer.classList.remove("hidden");
      uploadBar.style.width = "0%";
      uploadProgressText.textContent = "Uploading...";

      try {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", CLOUDINARY_URL, true);

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            uploadBar.style.width = percent + "%";
            uploadProgressText.textContent = `Uploading: ${percent}%`;
          }
        });

        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              const data = JSON.parse(xhr.responseText);
              imageUrl = data.secure_url;
              uploadProgressText.textContent = "✅ Upload complete!";
              setTimeout(() => {
                progressContainer.classList.add("hidden");
                uploadProgressText.textContent = "";
                saveReviewToFirebase();
              }, 800);
            } else {
              uploadProgressText.textContent = "❌ Upload failed";
              console.error("Cloudinary upload failed:", xhr.responseText);
            }
          }
        };

        xhr.send(formData);
        return;
      } catch (error) {
        console.error("Image upload failed:", error);
      }
    }

    // ✅ If no image, save immediately
    saveReviewToFirebase();

    function saveReviewToFirebase() {
      const review = {
        firstName,
        lastName,
        email,
        serviceNeeded,
        message,
        rating: parseInt(rating),
        profileUrl,
        imageUrl: imageUrl || "",
        timestamp: new Date().toISOString()
      };

      database.ref("reviews").push(review).then(() => {
        alert("✅ Thank you! Your feedback has been submitted.");
        reviewForm.reset();
      }).catch((error) => {
        console.error("Error saving review:", error);
      });
    }
  });

  // ⭐ Display feedback section
  const feedbackList = document.getElementById("feedbackList");

  database.ref("reviews").on("child_added", function(snapshot) {
    const data = snapshot.val();

    let starHTML = "";
    for (let i = 1; i <= 5; i++) {
      starHTML += `<i class="fas fa-star ${i <= data.rating ? 'text-yellow-400' : 'text-gray-300'}"></i>`;
    }

    const div = document.createElement("div");
    div.classList.add("flex", "items-start", "space-x-4", "p-4", "border-b");

    div.innerHTML = `
      <img src="${data.profileUrl || 'https://i.pravatar.cc/100'}" 
           class="w-12 h-12 rounded-full object-cover" alt="Profile">
      <div>
        <h4 class="font-semibold">${data.firstName} ${data.lastName}</h4>
        <p class="text-sm text-gray-500 mb-1">${data.serviceNeeded}</p>
        <div class="flex mb-2">${starHTML}</div>
        <p class="text-gray-700 mb-2">${data.message}</p>
        <span class="text-xs text-gray-400">${new Date(data.timestamp).toLocaleString()}</span>
        ${data.imageUrl ? `
          <div class="mt-3">
            <img src="${data.imageUrl}" class="w-32 h-32 object-cover rounded-md" alt="Uploaded Photo">
          </div>
        ` : ""}
      </div>
    `;

    feedbackList.prepend(div);
  });

});
