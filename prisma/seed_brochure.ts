import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  // CHOCOLATE SERIES
  { name: 'Choco Brownie', price: 36000, description: 'Brownis panggang rasa cokelat klasik yang nikmat.' },
  { name: 'Double Choco', price: 38000, description: 'Brownis dengan lapisan cokelat ganda yang lumer di mulut.' },
  { name: 'Choco Milk', price: 38000, description: 'Paduan manisnya cokelat dan susu pada brownis pilihan.' },
  // KUKUS SERIES
  { name: 'Lapis Kukus Fruity', price: 32000, description: 'Lapis kukus lembut dengan sensasi rasa buah yang segar.' },
  { name: 'Black Original', price: 36000, description: 'Brownis kukus original khas Brownis Cinta.' },
  { name: 'Red Velvet', price: 38000, description: 'Brownis kukus Red Velvet dengan warna menggoda dan rasa premium.' },
  { name: 'Pandan Coklat', price: 38000, description: 'Kombinasi harum pandan dan legitnya cokelat.' },
  // OVEN SERIES
  { name: 'Oven Keju Parut', price: 35000, description: 'Brownis oven dengan taburan keju parut melimpah.' },
  { name: 'Oven Almond', price: 35000, description: 'Brownis oven dengan irisan kacang almond renyah.' },
  { name: 'Oven Choco Flakes', price: 35000, description: 'Brownis oven renyah dengan tambahan choco flakes.' },
  { name: 'Fudgy Brownies', price: 38000, description: 'Brownis bertekstur fudgy yang padat dan super cokelat.' },
  // CHIFFON CAKE
  { name: 'Chiffon Mini', price: 15000, description: 'Chiffon cake ukuran mini yang ringan dan lembut.' },
  { name: 'Chiffon Original', price: 22000, description: 'Chiffon cake original dengan tekstur selembut kapas.' },
  { name: 'Chiffon Double Cheese', price: 24000, description: 'Chiffon cake dengan ekstrak keju ganda, gurih dan lembut.' },
  { name: 'Chiffon Choco Cheese', price: 24000, description: 'Perpaduan keju dan cokelat dalam chiffon cake super lembut.' },
  // ROLL CAKE
  { name: 'Roll Cake Nanas', price: 28000, description: 'Bolu gulung lembut dengan isian selai nanas asli.' },
  { name: 'Roll Cake Creamcheese', price: 30000, description: 'Bolu gulung premium dengan olesan creamcheese gurih.' },
  { name: 'Paket Roll Cake', price: 75000, description: 'Paket bolu gulung berbagai varian untuk acara spesial.' },
  // DESSERT SERIES
  { name: 'Dessert Box', price: 10000, description: 'Dessert box praktis dengan rasa manis yang pas.' },
  { name: 'Mini Puding', price: 10000, description: 'Puding segar ukuran mini, cocok untuk pencuci mulut.' },
  { name: 'Brownies Bites', price: 18000, description: 'Potongan kecil brownis sekali suap.' },
  { name: 'Puding Brownies', price: 70000, description: 'Kombinasi unik puding lembut dengan lapisan brownis.' },
  { name: 'Cookies & Cream', price: 45000, description: 'Dessert perpaduan biskuit renyah dan krim lezat.' },
  { name: 'Say Cheese', price: 45000, description: 'Kue keju spesial dengan tekstur lumer.' },
  { name: 'Tiramissu Coffee', price: 45000, description: 'Aroma kopi kuat berpadu dengan kelembutan tiramisu.' },
  { name: 'Choco Delight', price: 45000, description: 'Cokelat premium yang memanjakan lidah Anda.' },
  { name: 'Choco Delight Mini', price: 25000, description: 'Versi kecil dari Choco Delight.' },
  { name: 'Say Cheese Mini', price: 25000, description: 'Versi kecil dari kue keju lumer.' },
  { name: 'Tiramissu Coffee Mini', price: 25000, description: 'Versi mini tiramisu rasa kopi.' },
  { name: 'Cookies & Cream Mini', price: 25000, description: 'Cookies & Cream porsi pas.' },
  // PAKET
  { name: 'Paket Mini', price: 32000, description: 'Berbagai pilihan mini varian dalam satu paket hemat.' },
  { name: 'Paket Donat', price: 30000, description: 'Donat lembut aneka topping yang menggugah selera.' },
  // SNACK SERIES
  { name: 'Crispy Brownies', price: 20000, description: 'Brownis super tipis dan renyah seperti keripik.' },
  { name: 'Brownies Kering', price: 27000, description: 'Sensasi brownis renyah tahan lama untuk camilan.' },
  { name: 'Choco Rice Crispy', price: 25000, description: 'Camilan beras berlapis cokelat legit.' },
  { name: 'Stick Brownies', price: 30000, description: 'Brownis berbentuk stik yang praktis dimakan.' },
  { name: 'Choco Almond Stick', price: 30000, description: 'Stik berbalut cokelat dan taburan almond gurih.' }
];

async function main() {
  console.log('Start seeding...');
  for (const item of products) {
    const imageUrl = `https://placehold.co/400x400/8b1c31/ffffff?text=${encodeURIComponent(item.name)}`;
    await prisma.product.create({
      data: {
        name: item.name,
        price: item.price,
        description: item.description,
        stock: 100,
        image_url: imageUrl,
        is_bestseller: false,
        display_order: 0,
      }
    });
    console.log(`Created ${item.name}`);
  }
  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  });
