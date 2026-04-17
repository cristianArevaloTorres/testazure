using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LocktonOrion.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddScreenshotUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ScreenshotUrl",
                table: "QuotationResults",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ScreenshotUrl",
                table: "QuotationResults");
        }
    }
}
